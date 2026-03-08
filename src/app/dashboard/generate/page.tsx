'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface GeneratedPost {
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

type LoadingStep = 'analyzing' | 'generating' | null

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

function renderMarkdown(md: string): string {
  return md
    // Headings
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-white mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-white mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-8 mb-3">$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`(.+?)`/g, '<code class="bg-white/10 text-blue-300 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    // Unordered lists
    .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc text-gray-300">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-gray-300">$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ul class="my-3 space-y-1">${match}</ul>`)
    // Paragraphs (blank-line-separated blocks not already tagged)
    .replace(/^(?!<[hlu]|<\/[ul])(.+)$/gm, '<p class="text-gray-300 leading-relaxed my-2">$1</p>')
    // Clean up empty paragraphs
    .replace(/<p[^>]*>\s*<\/p>/g, '')
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div
      className="prose-custom"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  )
}

function GenerateForm({
  onResult,
}: {
  onResult: (post: GeneratedPost) => void
}) {
  const [url, setUrl] = useState('')
  const [topic, setTopic] = useState('')
  const [keywords, setKeywords] = useState('')
  const [tone, setTone] = useState('')
  const [loadingStep, setLoadingStep] = useState<LoadingStep>(null)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!url.trim()) {
      setError('URL is required')
      return
    }

    try {
      new URL(url.trim())
    } catch {
      setError('Please enter a valid URL (e.g. https://example.com)')
      return
    }

    setLoadingStep('analyzing')

    try {
      // Simulate brief delay before switching message
      const timer = setTimeout(() => setLoadingStep('generating'), 3000)

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          topic: topic.trim() || undefined,
          keywords: keywords.trim()
            ? keywords.split(',').map((k) => k.trim()).filter(Boolean)
            : undefined,
          tone: tone || undefined,
        }),
      })

      clearTimeout(timer)
      setLoadingStep(null)

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Failed to generate post. Please try again.')
        return
      }

      onResult(json as GeneratedPost)
    } catch {
      setLoadingStep(null)
      setError('Network error. Please check your connection and try again.')
    }
  }

  if (loadingStep) {
    return (
      <Card className="bg-white/5 border-white/10 p-8 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-blue-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-white font-semibold text-lg">
            {loadingStep === 'analyzing' ? 'Analyzing your website...' : 'Generating SEO-optimized content...'}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {loadingStep === 'analyzing'
              ? 'Scanning your site structure, content, and keywords'
              : 'Crafting a post tailored to your site and audience'}
          </p>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full bg-white/10" />
          <Skeleton className="h-4 w-5/6 bg-white/10" />
          <Skeleton className="h-4 w-4/6 bg-white/10" />
          <Skeleton className="h-4 w-full bg-white/10 mt-4" />
          <Skeleton className="h-4 w-3/4 bg-white/10" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-white/5 border-white/10 p-8 max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Website URL <span className="text-red-400">*</span>
          </label>
          <Input
            type="text"
            placeholder="https://yourwebsite.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Topic <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <Input
            type="text"
            placeholder="e.g. How to improve your conversion rate"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/50"
          />
          <p className="text-gray-600 text-xs mt-1">Leave blank to auto-suggest the best topic for your site</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Keywords <span className="text-gray-500 font-normal">(optional, comma-separated)</span>
          </label>
          <Input
            type="text"
            placeholder="e.g. SEO, content marketing, organic traffic"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Tone <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
          >
            <option value="" className="bg-[#0f1520]">Auto-detect from site</option>
            <option value="professional" className="bg-[#0f1520]">Professional</option>
            <option value="casual" className="bg-[#0f1520]">Casual</option>
            <option value="authoritative" className="bg-[#0f1520]">Authoritative</option>
            <option value="friendly" className="bg-[#0f1520]">Friendly</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white border-0 h-11 font-semibold"
        >
          Generate SEO Post
        </Button>
      </form>
    </Card>
  )
}

function PostResult({
  post,
  onSave,
  onReset,
  saving,
  saved,
}: {
  post: GeneratedPost
  onSave: () => void
  onReset: () => void
  saving: boolean
  saved: boolean
}) {
  const [copied, setCopied] = useState<'markdown' | 'html' | null>(null)

  function copyText(text: string, type: 'markdown' | 'html') {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  function getHtml() {
    return renderMarkdown(post.content)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header card */}
      <Card className="bg-white/5 border-white/10 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white leading-tight">{post.title}</h2>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">{post.meta_description}</p>
          </div>
          <SeoScoreBadge score={post.seo_score} />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {post.word_count?.toLocaleString()} words
          </div>
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {post.reading_time} min read
          </div>
        </div>

        {/* Keywords */}
        {post.keywords?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.keywords.map((kw, i) => (
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

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={onSave}
          disabled={saving || saved}
          className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white border-0 disabled:opacity-60"
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save to Dashboard'}
        </Button>
        <Button
          variant="outline"
          className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
          onClick={() => copyText(post.content, 'markdown')}
        >
          {copied === 'markdown' ? 'Copied!' : 'Copy Markdown'}
        </Button>
        <Button
          variant="outline"
          className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
          onClick={() => copyText(getHtml(), 'html')}
        >
          {copied === 'html' ? 'Copied!' : 'Copy HTML'}
        </Button>
        <Button
          variant="ghost"
          className="text-gray-400 hover:text-white ml-auto"
          onClick={onReset}
        >
          Generate Another
        </Button>
      </div>

      {/* Content */}
      <Card className="bg-white/5 border-white/10 p-6 lg:p-8">
        <MarkdownContent content={post.content} />
      </Card>

      {/* FAQ */}
      {post.faq?.length > 0 && (
        <Card className="bg-white/5 border-white/10 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {post.faq.map((item, i) => (
              <div key={i} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                <p className="text-white font-medium text-sm mb-1">{item.q}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export default function GeneratePage() {
  const router = useRouter()
  const [result, setResult] = useState<GeneratedPost | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  async function handleSave() {
    if (!result) return
    setSaving(true)
    setSaveError('')

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: result.title,
          slug: result.slug,
          meta_description: result.meta_description,
          content: result.content,
          keywords: result.keywords,
          word_count: result.word_count,
          reading_time: result.reading_time,
          seo_score: result.seo_score,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setSaveError(json.error || 'Failed to save post')
        return
      }

      setSaved(true)
      // Navigate to the new post after a short delay
      setTimeout(() => {
        router.push(`/dashboard/posts/${json.post.id}`)
      }, 800)
    } catch {
      setSaveError('Network error. Could not save post.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Generate Blog Post</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Enter your website URL and let AI write an SEO-optimized blog post for you
        </p>
      </div>

      {saveError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-6 max-w-4xl mx-auto">
          <p className="text-red-400 text-sm">{saveError}</p>
        </div>
      )}

      {result ? (
        <PostResult
          post={result}
          onSave={handleSave}
          onReset={() => { setResult(null); setSaved(false); setSaveError('') }}
          saving={saving}
          saved={saved}
        />
      ) : (
        <GenerateForm onResult={setResult} />
      )}
    </div>
  )
}
