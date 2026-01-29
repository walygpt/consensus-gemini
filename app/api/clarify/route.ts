import { NextResponse } from 'next/server'

interface ClarifyRequest {
  problem: string
  constraints: {
    budget?: string
    timeframe?: string
    stakeholders?: string[]
    legal?: string
    priority?: string
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'REPLACE_ME') {
    return NextResponse.json({
      error: 'GEMINI_API_KEY not configured'
    }, { status: 400 })
  }
  
  try {
    const body: ClarifyRequest = await request.json()
    
    if (!body.problem || body.problem.trim().length < 10) {
      return NextResponse.json({
        error: 'Problem description must be at least 10 characters'
      }, { status: 400 })
    }
    
    console.log('CLARIFY_REQUEST:', { problemLength: body.problem.length })
    console.log('GEMINI_CALL_START: Generating clarifying questions')
    
    const prompt = `You are Consensus, a conservative and factual planning agent. Based on the following problem and constraints, generate 2-4 clarifying questions that would help create a better decision package.

Problem: ${body.problem}

Constraints:
- Budget: ${body.constraints.budget || 'Not specified'}
- Timeframe: ${body.constraints.timeframe || 'Not specified'}
- Stakeholders: ${body.constraints.stakeholders?.join(', ') || 'Not specified'}
- Legal constraints: ${body.constraints.legal || 'Not specified'}
- Priority: ${body.constraints.priority || 'Not specified'}

Return ONLY a valid JSON array of questions, each with an "id" and "question" field. Example:
[{"id": "q1", "question": "What is the expected ROI?"}, {"id": "q2", "question": "Who are the key decision makers?"}]

Do not include any other text or explanation.`

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
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        })
      }
    )
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('GEMINI_CALL_ERROR:', errorData)
      return NextResponse.json({
        error: 'Gemini API error',
        details: errorData
      }, { status: 502 })
    }
    
    const data = await response.json()
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!textResponse) {
      return NextResponse.json({
        error: 'Empty response from Gemini'
      }, { status: 502 })
    }
    
    // Parse JSON from response (handle markdown code blocks)
    let questions
    try {
      const jsonMatch = textResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0])
      } else {
        questions = JSON.parse(textResponse)
      }
    } catch {
      console.error('GEMINI_PARSE_ERROR: Failed to parse questions JSON')
      return NextResponse.json({
        error: 'Failed to parse Gemini response'
      }, { status: 502 })
    }
    
    console.log('GEMINI_CALL_SUCCESS: Generated clarifying questions')
    
    return NextResponse.json({ questions })
  } catch (error) {
    console.error('CLARIFY_ERROR:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
