import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ posts: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    title,
    slug,
    meta_description,
    content,
    keywords,
    word_count,
    reading_time,
    seo_score,
    site_id,
  } = body

  if (!title || !content) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      site_id: site_id ?? null,
      title,
      slug,
      meta_description,
      content,
      keywords: keywords ?? [],
      word_count: word_count ?? null,
      reading_time: reading_time ?? null,
      seo_score: seo_score ?? null,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Increment posts_generated_this_month for manual saves
  const { data: profile } = await supabase
    .from('profiles')
    .select('posts_generated_this_month')
    .eq('id', user.id)
    .single()

  if (profile) {
    await supabase
      .from('profiles')
      .update({
        posts_generated_this_month: (profile.posts_generated_this_month ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
  }

  return NextResponse.json({ post: data }, { status: 201 })
}
