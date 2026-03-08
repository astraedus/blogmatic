export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PostActions from './PostActions'

function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-white mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-white mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-8 mb-3">$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-white/10 text-blue-300 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc text-gray-300">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-gray-300">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ul class="my-3 space-y-1">${match}</ul>`)
    .replace(/^(?!<[hlu]|<\/[ul])(.+)$/gm, '<p class="text-gray-300 leading-relaxed my-2">$1</p>')
    .replace(/<p[^>]*>\s*<\/p>/g, '')
}

function SeoScoreBadge({ score }: { score: number }) {
  const rounded = Math.round(score)
  const colorClass =
    rounded >= 80
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : rounded >= 60
      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      : 'bg-red-500/20 text-red-400 border-red-500/30'

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full border ${colorClass}`}>
      SEO Score: {rounded}
    </span>
  )
}

export default async function PostPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !post) notFound()

  const html = renderMarkdown(post.content ?? '')

  return (
    <div className="p-8">
      {/* Back nav */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Meta card */}
        <Card className="bg-white/5 border-white/10 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white leading-tight">{post.title}</h1>
              {post.meta_description && (
                <p className="text-gray-400 text-sm mt-2 leading-relaxed">{post.meta_description}</p>
              )}
            </div>
            {post.seo_score != null && <SeoScoreBadge score={post.seo_score} />}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
            {post.word_count && (
              <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {post.word_count.toLocaleString()} words
              </div>
            )}
            {post.reading_time && (
              <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {post.reading_time} min read
              </div>
            )}
            <div className="flex items-center gap-1.5 text-gray-400 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(post.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>

          {/* Keywords */}
          {post.keywords?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {(post.keywords as string[]).map((kw, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="bg-blue-500/10 border-blue-500/30 text-blue-300 text-xs"
                >
                  {kw}
                </Badge>
              ))}
            </div>
          )}
        </Card>

        {/* Actions (client component for interactivity) */}
        <PostActions postId={post.id} content={post.content ?? ''} html={html} />

        {/* Content */}
        <Card className="bg-white/5 border-white/10 p-6 lg:p-8">
          <div
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </Card>
      </div>
    </div>
  )
}
