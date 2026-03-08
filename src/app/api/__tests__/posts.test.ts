import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { GET, POST } from '../posts/route'

const mockUser = { id: 'user-123', email: 'test@example.com' }

const mockPosts = [
  {
    id: 'post-1',
    user_id: 'user-123',
    title: 'First Post',
    content: 'Content 1',
    status: 'draft',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'post-2',
    user_id: 'user-123',
    title: 'Second Post',
    content: 'Content 2',
    status: 'published',
    created_at: '2024-01-02T00:00:00Z',
  },
]

function makePostRequest(body: object) {
  return new NextRequest('http://localhost/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function setupSupabaseMock(user: typeof mockUser | null) {
  const insertSelectSingle = vi.fn().mockResolvedValue({
    data: { id: 'new-post', ...mockPosts[0] },
    error: null,
  })
  const insertSelect = vi.fn().mockReturnValue({ single: insertSelectSingle })
  const insertMock = vi.fn().mockReturnValue({ select: insertSelect })

  const orderMock = vi.fn().mockResolvedValue({ data: mockPosts, error: null })
  const selectEqOrder = vi.fn().mockReturnValue({ order: orderMock })
  const selectMock = vi.fn().mockReturnValue({ eq: selectEqOrder })

  const updateEqMock = vi.fn().mockResolvedValue({ data: null, error: null })
  const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock })

  // Profile select for increment
  const profileSingle = vi.fn().mockResolvedValue({ data: { posts_generated_this_month: 1 }, error: null })
  const profileSelectEq = vi.fn().mockReturnValue({ single: profileSingle })

  let callCount = 0
  const fromMock = vi.fn().mockImplementation((table: string) => {
    if (table === 'posts') {
      return { select: selectMock, insert: insertMock }
    }
    if (table === 'profiles') {
      callCount++
      if (callCount === 1) {
        return { select: vi.fn().mockReturnValue({ eq: profileSelectEq }) }
      }
      return { update: updateMock }
    }
    return { select: selectMock, insert: insertMock, update: updateMock }
  })

  const supabaseMock = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: fromMock,
  }

  vi.mocked(createClient).mockResolvedValue(supabaseMock as unknown as ReturnType<typeof createClient> extends Promise<infer T> ? T : never)
  return supabaseMock
}

describe('GET /api/posts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 if not authenticated', async () => {
    setupSupabaseMock(null)

    const res = await GET()
    expect(res.status).toBe(401)

    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it("returns user's posts when authenticated", async () => {
    setupSupabaseMock(mockUser)

    const res = await GET()
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.posts).toBeDefined()
    expect(Array.isArray(body.posts)).toBe(true)
  })
})

describe('POST /api/posts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 if not authenticated', async () => {
    setupSupabaseMock(null)

    const req = makePostRequest({ title: 'Test', content: 'Content' })
    const res = await POST(req)
    expect(res.status).toBe(401)

    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 400 if title or content is missing', async () => {
    setupSupabaseMock(mockUser)

    const req = makePostRequest({ title: 'Test' }) // missing content
    const res = await POST(req)
    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body.error).toContain('required')
  })

  it('saves a new post and returns 201', async () => {
    setupSupabaseMock(mockUser)

    const req = makePostRequest({
      title: 'My New Post',
      content: 'This is the content of my new post.',
      slug: 'my-new-post',
      meta_description: 'A great post about things.',
      keywords: ['test', 'vitest'],
      word_count: 100,
      reading_time: 1,
      seo_score: 80,
    })
    const res = await POST(req)
    expect(res.status).toBe(201)

    const body = await res.json()
    expect(body.post).toBeDefined()
  })

  it('returns 400 for invalid JSON body', async () => {
    setupSupabaseMock(mockUser)

    const req = new NextRequest('http://localhost/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-valid-json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
