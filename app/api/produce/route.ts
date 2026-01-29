import { NextResponse } from 'next/server'

interface ProduceRequest {
  mode: 'gemini'
  problem: string
  constraints: {
    budget?: string
    timeframe?: string
    stakeholders?: string[]
    legal?: string
    priority?: string
  }
  answers?: Record<string, string>
}

interface DecisionPackage {
  title: string
  headline: string
  summary: string
  options: Array<{
    id: string
    title: string
    description: string
    pros: string[]
    cons: string[]
    estimated_cost: string
    estimated_time_weeks: number
    success_probability: number
  }>
  recommended_plan: Array<{
    step_number: number
    action: string
    owner: string
    estimated_time_days: number
  }>
  scenarios: {
    best: string
    expected: string
    worst: string
  }
  stakeholder_messages: Array<{
    stakeholder: string
    channel: string
    tone: 'formal' | 'neutral' | 'persuasive'
    message: string
  }>
  metrics: Array<{
    metric_name: string
    target: string
    measure_frequency: string
  }>
  processing_notes: string | null
}

async function callGeminiWithRetry(
  apiKey: string,
  prompt: string,
  systemPrompt: string,
  retries = 1
): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 40000)
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 8192
            }
          }),
          signal: controller.signal
        }
      )
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle rate limiting - don't retry on quota exhaustion
        if (response.status === 429) {
          const error = errorData.error?.message || 'API quota exceeded'
          const quotaError = new Error(error)
          ;(quotaError as any).isQuotaError = true
          ;(quotaError as any).status = 429
          throw quotaError
        }
        
        throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`)
      }
      
      const data = await response.json()
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
      
      if (!textResponse) {
        throw new Error('Empty response from Gemini')
      }
      
      return textResponse
    } catch (error) {
      const err = error as any
      console.error(`GEMINI_CALL_ERROR (attempt ${attempt + 1}):`, error)
      
      // Don't retry on quota errors
      if (err.isQuotaError || err.status === 429) {
        throw error
      }
      
      if (attempt === retries) {
        throw error
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
  throw new Error('Max retries exceeded')
}

function validateDecisionPackage(data: unknown): data is DecisionPackage {
  if (!data || typeof data !== 'object') return false
  const pkg = data as Record<string, unknown>
  
  // Check required fields
  if (typeof pkg.title !== 'string') return false
  if (typeof pkg.headline !== 'string') return false
  if (typeof pkg.summary !== 'string') return false
  if (!Array.isArray(pkg.options)) return false
  if (!Array.isArray(pkg.recommended_plan)) return false
  if (!pkg.scenarios || typeof pkg.scenarios !== 'object') return false
  if (!Array.isArray(pkg.stakeholder_messages)) return false
  if (!Array.isArray(pkg.metrics)) return false
  
  // Validate options
  for (const opt of pkg.options) {
    if (!opt.id || !opt.title || !opt.description) return false
    if (!Array.isArray(opt.pros) || !Array.isArray(opt.cons)) return false
    if (typeof opt.success_probability !== 'number') return false
  }
  
  // Validate scenarios
  const scenarios = pkg.scenarios as Record<string, unknown>
  if (typeof scenarios.best !== 'string') return false
  if (typeof scenarios.expected !== 'string') return false
  if (typeof scenarios.worst !== 'string') return false
  
  return true
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'REPLACE_ME') {
    return NextResponse.json({
      error: 'GEMINI_API_KEY not configured. Please set the GEMINI_API_KEY environment variable.'
    }, { status: 400 })
  }
  
  try {
    const body: ProduceRequest = await request.json()
    
    if (!body.problem || body.problem.trim().length < 10) {
      return NextResponse.json({
        error: 'Problem description must be at least 10 characters'
      }, { status: 400 })
    }
    
    console.log('PRODUCE_REQUEST:', { 
      problemLength: body.problem.length,
      hasAnswers: !!body.answers
    })
    console.log('GEMINI_CALL_START: Generating decision package')
    
    const systemPrompt = `You are Consensus, a conservative and factual planning agent. ONLY return valid JSON matching the schema exactly. Do not include commentary, analysis text, or extra fields. If information is missing, use null or empty arrays but do not hallucinate facts.`
    
    const answersSection = body.answers && Object.keys(body.answers).length > 0
      ? `\n\nClarifying Question Answers:\n${Object.entries(body.answers).map(([q, a]) => `- ${q}: ${a}`).join('\n')}`
      : ''
    
    const userPrompt = `Generate a decision package for the following problem and constraints. Return ONLY valid JSON matching this exact structure:

{
  "title": "<string - descriptive title for the decision>",
  "headline": "<string - one-line summary>",
  "summary": "<string - 2-3 sentence executive summary>",
  "options": [
    {
      "id": "<string - unique id like opt1>",
      "title": "<string>",
      "description": "<string>",
      "pros": ["<string>", ...],
      "cons": ["<string>", ...],
      "estimated_cost": "<string like '$10,000-$50,000'>",
      "estimated_time_weeks": <number>,
      "success_probability": <number 0-100>
    }
  ],
  "recommended_plan": [
    {
      "step_number": <number starting at 1>,
      "action": "<string - specific action to take>",
      "owner": "<string - role responsible>",
      "estimated_time_days": <number>
    }
  ],
  "scenarios": {
    "best": "<string - best case outcome>",
    "expected": "<string - most likely outcome>",
    "worst": "<string - worst case outcome>"
  },
  "stakeholder_messages": [
    {
      "stakeholder": "<string - who to communicate to>",
      "channel": "<string - email/press/social/etc>",
      "tone": "<'formal'|'neutral'|'persuasive'>",
      "message": "<string - the actual message>"
    }
  ],
  "metrics": [
    {
      "metric_name": "<string>",
      "target": "<string>",
      "measure_frequency": "<string - daily/weekly/monthly>"
    }
  ],
  "processing_notes": "<string or null>"
}

Problem Description:
${body.problem}

Constraints:
- Budget: ${body.constraints.budget || 'Not specified'}
- Timeframe: ${body.constraints.timeframe || 'Not specified'}
- Stakeholders: ${body.constraints.stakeholders?.join(', ') || 'Not specified'}
- Legal constraints: ${body.constraints.legal || 'Not specified'}
- Priority: ${body.constraints.priority || 'Not specified'}${answersSection}

Provide 3-5 realistic options with honest assessments. Be conservative with success probabilities. Create a practical step-by-step plan for the recommended approach.`

    const textResponse = await callGeminiWithRetry(apiKey, userPrompt, systemPrompt)
    
    // Parse JSON from response
    let decisionPackage: DecisionPackage
    try {
      // Handle markdown code blocks
      const jsonMatch = textResponse.match(/```(?:json)?\s*([\s\S]*?)```/) || 
                       textResponse.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0]
        decisionPackage = JSON.parse(jsonStr)
      } else {
        decisionPackage = JSON.parse(textResponse)
      }
    } catch {
      console.error('GEMINI_PARSE_ERROR: Failed to parse decision package JSON')
      console.error('Raw response:', textResponse.substring(0, 500))
      return NextResponse.json({
        error: 'Failed to parse Gemini response as valid JSON'
      }, { status: 502 })
    }
    
    // Validate against schema
    if (!validateDecisionPackage(decisionPackage)) {
      console.error('SCHEMA_VALIDATION_ERROR: Response does not match expected schema')
      return NextResponse.json({
        error: 'Response does not match expected schema'
      }, { status: 502 })
    }
    
    console.log('GEMINI_CALL_SUCCESS: Generated decision package')
    
    return NextResponse.json({
      success: true,
      result: decisionPackage
    })
  } catch (error) {
    const err = error as any
    console.error('PRODUCE_ERROR:', error)
    
    // Handle quota/rate limit errors specifically
    if (err.status === 429 || err.isQuotaError || (err.message && err.message.includes('exceeded your current quota'))) {
      return NextResponse.json({
        error: 'API quota exceeded. The Gemini API free tier has reached its rate limit. Please wait a few minutes and try again, or upgrade your Gemini API plan at https://ai.google.dev/billing/overview',
        isQuotaError: true
      }, { status: 429 })
    }
    
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
