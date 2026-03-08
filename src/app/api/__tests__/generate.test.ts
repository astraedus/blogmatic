import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock the analyzer
vi.mock('@/lib/analyzer', () => ({
  analyzeSite: vi.fn(),
}))

// Mock GoogleGenAI with a class-compatible mock
const mockGenerateContent = vi.fn()
vi.mock('@google/genai', () => ({
  GoogleGenAI: function MockGoogleGenAI() {
    this.models = { generateContent: mockGenerateContent }
  },
}))

import { createClient } from '@/lib/supabase/server'
import { analyzeSite } from '@/lib/analyzer'
import { POST } from '../generate/route'

const mockUser = { id: 'user-123', email: 'test@example.com' }

const mockProfile = {
  posts_generated_this_month: 1,
  monthly_post_limit: 3,
  plan: 'free',
}

const mockSiteContext = {
  url: 'https://example.com',
  title: 'Example Site',
  metaDescription: 'Example description',
  headings: ['Heading 1', 'Heading 2'],
  paragraphSnippets: [],
  links: [],
  detectedIndustry: 'saas',
  detectedTone: 'professional',
  keywords: ['software', 'platform'],
}

const mockGeneratedPost = {
  title: 'Test Blog Post Title for SEO',
  slug: 'test-blog-post-title-for-seo',
  meta_description: 'This is a test meta description for the blog post.',
  content: '# Test\n\nThis is the content.',
  keywords: ['test', 'blog'],
  word_count: 500,
  reading_time: 2,
  seo_score: 85,
  faq: [{ q: 'What is this?', a: 'A test post.' }],
}

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function setupSupabaseMock(user: typeof mockUser | null, profile: typeof mockProfile | null) {
  const updateEqMock = vi.fn().mockResolvedValue({ data: null, error: null })
  const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock })
  const singleMock = vi.fn().mockResolvedValue({ data: profile, error: null })
  const selectEqMock = vi.fn().mockReturnValue({ single: singleMock })
  const selectMock = vi.fn().mockReturnValue({ eq: selectEqMock })

  const supabaseMock = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn().mockReturnValue({
      select: selectMock,
      update: updateMock,
    }),
  }
  vi.mocked(createClient).mockResolvedValue(supabaseMock as unknown as ReturnType<typeof createClient> extends Promise<infer T> ? T : never)
  return supabaseMock
}

describe('POST /api/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GOOGLE_API_KEY = 'test-api-key'
  })

  it('returns 401 if not authenticated', async () => {
    setupSupabaseMock(null, null)

    const req = makeRequest({ url: 'https://example.com' })
    const res = await POST(req)
    expect(res.status).toBe(401)

    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 422 if URL is missing', async () => {
    setupSupabaseMock(mockUser, mockProfile)

    const req = makeRequest({})
    const res = await POST(req)
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.error).toContain('URL')
  })

  it('returns 403 if user is over monthly limit', async () => {
    const overLimitProfile = { ...mockProfile, posts_generated_this_month: 3, monthly_post_limit: 3 }
    setupSupabaseMock(mockUser, overLimitProfile)

    const req = makeRequest({ url: 'https://example.com' })
    const res = await POST(req)
    expect(res.status).toBe(403)

    const body = await res.json()
    expect(body.error).toContain('limit')
    expect(body.upgrade).toBe(true)
  })

  it('returns generated post on success', async () => {
    setupSupabaseMock(mockUser, mockProfile)
    vi.mocked(analyzeSite).mockResolvedValue(mockSiteContext)
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(mockGeneratedPost),
    })

    const req = makeRequest({ url: 'https://example.com' })
    const res = await POST(req)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.title).toBe(mockGeneratedPost.title)
    expect(body.site_context).toBeDefined()
    expect(body.site_context.industry).toBe('saas')
  })

  it('returns 422 if URL analysis fails', async () => {
    setupSupabaseMock(mockUser, mockProfile)
    vi.mocked(analyzeSite).mockRejectedValue(new Error('Failed to fetch URL: Network error'))

    const req = makeRequest({ url: 'https://example.com' })
    const res = await POST(req)
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.error).toContain('Failed to analyze URL')
  })

  it('returns 500 if Gemini fails', async () => {
    setupSupabaseMock(mockUser, mockProfile)
    vi.mocked(analyzeSite).mockResolvedValue(mockSiteContext)
    mockGenerateContent.mockRejectedValue(new Error('Gemini API error'))

    const req = makeRequest({ url: 'https://example.com' })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
