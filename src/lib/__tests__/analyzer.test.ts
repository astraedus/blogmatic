import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeSite } from '../analyzer'

const MOCK_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Acme SaaS Platform - The Best Dashboard Software</title>
  <meta name="description" content="Acme is the leading SaaS platform for team collaboration and project management." />
</head>
<body>
  <nav>Navigation content</nav>
  <h1>Welcome to Acme</h1>
  <h2>Dashboard Features</h2>
  <h2>API Integration</h2>
  <h3>Subscription Plans</h3>
  <p>Our software platform offers enterprise-grade solutions with seamless API integration and a powerful dashboard for managing your team.</p>
  <p>We provide trial accounts so you can explore the full capabilities of our platform before committing to a subscription.</p>
  <a href="/features">Features</a>
  <a href="/pricing">Pricing</a>
  <a href="https://external.com/page">External link</a>
  <footer>Footer content</footer>
</body>
</html>
`

describe('analyzeSite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('extracts title from HTML', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      text: () => Promise.resolve(MOCK_HTML),
    }))

    const result = await analyzeSite('https://example.com')
    expect(result.title).toBe('Acme SaaS Platform - The Best Dashboard Software')
  })

  it('extracts meta description', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      text: () => Promise.resolve(MOCK_HTML),
    }))

    const result = await analyzeSite('https://example.com')
    expect(result.metaDescription).toContain('leading SaaS platform')
  })

  it('extracts headings', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      text: () => Promise.resolve(MOCK_HTML),
    }))

    const result = await analyzeSite('https://example.com')
    // nav/footer are stripped, but h1/h2/h3 in body should be captured
    expect(result.headings.some(h => h.includes('Dashboard Features'))).toBe(true)
    expect(result.headings.some(h => h.includes('API Integration'))).toBe(true)
  })

  it('detects saas industry from content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      text: () => Promise.resolve(MOCK_HTML),
    }))

    const result = await analyzeSite('https://example.com')
    expect(result.detectedIndustry).toBe('saas')
  })

  it('extracts keywords from page content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      text: () => Promise.resolve(MOCK_HTML),
    }))

    const result = await analyzeSite('https://example.com')
    expect(result.keywords.length).toBeGreaterThan(0)
    // 'platform' appears multiple times in the mock HTML
    expect(result.keywords).toContain('platform')
  })

  it('extracts internal links only', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      text: () => Promise.resolve(MOCK_HTML),
    }))

    const result = await analyzeSite('https://example.com')
    expect(result.links).toContain('/features')
    expect(result.links).toContain('/pricing')
    // External link should NOT be included
    expect(result.links.every(l => !l.includes('external.com'))).toBe(true)
  })

  it('detects tone from text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      text: () => Promise.resolve(MOCK_HTML),
    }))

    const result = await analyzeSite('https://example.com')
    expect(['formal', 'conversational', 'professional']).toContain(result.detectedTone)
  })

  it('throws on fetch error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network timeout')))

    await expect(analyzeSite('https://example.com')).rejects.toThrow('Failed to fetch URL')
  })

  it('returns the url in the result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      text: () => Promise.resolve(MOCK_HTML),
    }))

    const result = await analyzeSite('https://example.com')
    expect(result.url).toBe('https://example.com')
  })
})
