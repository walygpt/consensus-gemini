import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'REPLACE_ME') {
    return NextResponse.json({
      geminiConfigured: false,
      reason: 'GEMINI_API_KEY missing or not configured'
    })
  }
  
  return NextResponse.json({
    geminiConfigured: true
  })
}
