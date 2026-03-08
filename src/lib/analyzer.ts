import * as cheerio from 'cheerio'

export interface SiteContext {
  url: string
  title: string
  metaDescription: string
  headings: string[]
  paragraphSnippets: string[]
  links: string[]
  detectedIndustry: string
  detectedTone: string
  keywords: string[]
}

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  'e-commerce': ['shop', 'buy', 'cart', 'product', 'price', 'order', 'checkout', 'store'],
  'saas': ['software', 'platform', 'dashboard', 'api', 'integration', 'subscription', 'trial'],
  'healthcare': ['health', 'medical', 'patient', 'doctor', 'clinic', 'treatment', 'wellness'],
  'finance': ['finance', 'investment', 'banking', 'loan', 'insurance', 'payment', 'money'],
  'education': ['learn', 'course', 'student', 'education', 'training', 'certificate', 'tutorial'],
  'marketing': ['marketing', 'seo', 'advertising', 'campaign', 'brand', 'content', 'social media'],
  'real estate': ['property', 'real estate', 'home', 'rent', 'buy', 'mortgage', 'listing'],
  'travel': ['travel', 'hotel', 'flight', 'vacation', 'tour', 'booking', 'destination'],
  'food': ['restaurant', 'recipe', 'food', 'menu', 'dining', 'cooking', 'cuisine'],
  'technology': ['tech', 'software', 'hardware', 'app', 'digital', 'innovation', 'developer'],
}

function detectIndustry(text: string): string {
  const lowerText = text.toLowerCase()
  let bestMatch = 'general'
  let bestScore = 0

  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    const score = keywords.filter(kw => lowerText.includes(kw)).length
    if (score > bestScore) {
      bestScore = score
      bestMatch = industry
    }
  }

  return bestMatch
}

function detectTone(text: string): string {
  const lowerText = text.toLowerCase()

  const formalWords = ['therefore', 'furthermore', 'consequently', 'moreover', 'utilize', 'implement']
  const casualWords = ["you'll", "we'll", "don't", "can't", "it's", 'awesome', 'amazing', 'super']
  const professionalWords = ['solution', 'expertise', 'enterprise', 'strategy', 'optimize', 'leverage']

  const formalScore = formalWords.filter(w => lowerText.includes(w)).length
  const casualScore = casualWords.filter(w => lowerText.includes(w)).length
  const professionalScore = professionalWords.filter(w => lowerText.includes(w)).length

  if (formalScore > casualScore && formalScore > professionalScore) return 'formal'
  if (casualScore > formalScore) return 'conversational'
  return 'professional'
}

function extractKeywords(text: string, limit = 10): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
    'we', 'you', 'our', 'your', 'us', 'it', 'its', 'they', 'their',
    'more', 'also', 'all', 'any', 'both', 'each', 'few', 'into', 'through',
  ])

  const wordFreq: Record<string, number> = {}
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []

  for (const word of words) {
    if (!stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1
    }
  }

  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word)
}

export async function analyzeSite(url: string): Promise<SiteContext> {
  let html: string

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BlogmaticBot/1.0)',
      },
      signal: AbortSignal.timeout(10000),
    })
    html = await response.text()
  } catch (error) {
    throw new Error(`Failed to fetch URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  const $ = cheerio.load(html)

  // Remove script and style tags
  $('script, style, nav, footer, header').remove()

  const title = $('title').text().trim() || $('h1').first().text().trim() || ''
  const metaDescription =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    ''

  const headings: string[] = []
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().trim()
    if (text && text.length > 3) headings.push(text)
  })

  const paragraphSnippets: string[] = []
  $('p').each((_, el) => {
    const text = $(el).text().trim()
    if (text.length > 50) {
      paragraphSnippets.push(text.slice(0, 200))
    }
  })

  const baseUrl = new URL(url)
  const links: string[] = []
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (href) {
      try {
        const linkUrl = new URL(href, url)
        if (linkUrl.hostname === baseUrl.hostname && !links.includes(linkUrl.pathname)) {
          links.push(linkUrl.pathname)
        }
      } catch {
        // ignore invalid URLs
      }
    }
  })

  const fullText = [
    title,
    metaDescription,
    ...headings,
    ...paragraphSnippets,
  ].join(' ')

  const detectedIndustry = detectIndustry(fullText)
  const detectedTone = detectTone(fullText)
  const keywords = extractKeywords(fullText)

  return {
    url,
    title,
    metaDescription,
    headings: headings.slice(0, 20),
    paragraphSnippets: paragraphSnippets.slice(0, 10),
    links: links.slice(0, 30),
    detectedIndustry,
    detectedTone,
    keywords,
  }
}
