import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { analyzeSite } from '@/lib/analyzer'

export interface GenerateRequest {
  url: string
  topic?: string
  keywords?: string[]
  tone?: string
}

export interface GeneratedPost {
  title: string
  slug: string
  meta_description: string
  content: string
  keywords: string[]
  word_count: number
  reading_time: number
  seo_score: number
  faq: Array<{ q: string; a: string }>
}

function buildPrompt(
  url: string,
  detectedIndustry: string,
  extractedTopics: string[],
  detectedTone: string,
  keywords: string[],
  topic?: string
): string {
  return `You are an expert SEO content writer. Generate a blog post for the following website.

Website: ${url}
Industry: ${detectedIndustry}
Existing content topics: ${extractedTopics.slice(0, 10).join(', ')}
Site tone: ${detectedTone}
Target keywords: ${keywords.slice(0, 5).join(', ')}
Topic: ${topic || 'Auto-suggest the most relevant topic based on the site'}

Requirements:
- Title: 50-60 characters, include primary keyword naturally
- Meta description: 150-155 characters, compelling, includes keyword
- Structure: Introduction, 5-7 H2 sections, conclusion
- Length: 1500-2000 words
- Include internal link suggestions based on existing site pages
- Natural keyword density (1-2%)
- Conversational but authoritative tone matching the site
- Include a FAQ section with 3-4 questions (for schema markup)
- End with a clear call-to-action

Return ONLY valid JSON (no markdown code fences, no explanation) in this exact format:
{
  "title": "...",
  "slug": "...",
  "meta_description": "...",
  "content": "... (full markdown)",
  "keywords": ["primary", "secondary"],
  "word_count": 1500,
  "reading_time": 7,
  "seo_score": 85,
  "faq": [{"q": "...", "a": "..."}]
}`
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json()
    const { url, topic, keywords: userKeywords, tone: userTone } = body

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Step 1: Analyze the site
    let siteContext
    try {
      siteContext = await analyzeSite(url)
    } catch (error) {
      return NextResponse.json(
        { error: `Failed to analyze URL: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 422 }
      )
    }

    const keywords = userKeywords?.length
      ? userKeywords
      : siteContext.keywords

    const tone = userTone || siteContext.detectedTone

    // Step 2: Build prompt
    const prompt = buildPrompt(
      url,
      siteContext.detectedIndustry,
      siteContext.headings,
      tone,
      keywords,
      topic
    )

    // Step 3: Call Gemini
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const ai = new GoogleGenAI({ apiKey })

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    })

    const rawText = response.text
    if (!rawText) {
      return NextResponse.json({ error: 'No content generated' }, { status: 500 })
    }

    // Step 4: Parse JSON response
    let generatedPost: GeneratedPost
    try {
      // Strip markdown code fences if model adds them despite instructions
      const cleaned = rawText
        .replace(/^```(?:json)?\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim()
      generatedPost = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response as JSON' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...generatedPost,
      site_context: {
        industry: siteContext.detectedIndustry,
        tone: siteContext.detectedTone,
        detected_keywords: siteContext.keywords.slice(0, 10),
      },
    })
  } catch (error) {
    console.error('Generate route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
