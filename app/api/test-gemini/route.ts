import { NextResponse } from 'next/server'

export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'REPLACE_ME') {
    return NextResponse.json({
      success: false,
      error: 'GEMINI_API_KEY not configured'
    }, { status: 400 })
  }
  
  const startTime = Date.now()
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Say "Consensus API test successful" in exactly those words.' }]
          }]
        })
      }
    )
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('GEMINI_CALL_ERROR:', errorData)
      return NextResponse.json({
        success: false,
        error: 'Gemini API error',
        details: errorData
      }, { status: 502 })
    }
    
    const latencyMs = Date.now() - startTime
    console.log('GEMINI_CALL_SUCCESS: Test ping successful')
    
    return NextResponse.json({
      success: true,
      latencyMs
    })
  } catch (error) {
    console.error('GEMINI_CALL_ERROR:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to connect to Gemini API'
    }, { status: 500 })
  }
}
