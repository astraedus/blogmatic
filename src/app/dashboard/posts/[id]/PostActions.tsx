'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface PostActionsProps {
  postId: string
  content: string
  html: string
}

export default function PostActions({ postId, content, html }: PostActionsProps) {
  const router = useRouter()
  const [copied, setCopied] = useState<'markdown' | 'html' | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function copyText(text: string, type: 'markdown' | 'html') {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
        onClick={() => copyText(content, 'markdown')}
      >
        {copied === 'markdown' ? 'Copied!' : 'Copy Markdown'}
      </Button>
      <Button
        variant="outline"
        className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
        onClick={() => copyText(html, 'html')}
      >
        {copied === 'html' ? 'Copied!' : 'Copy HTML'}
      </Button>
      <Button
        variant="outline"
        className={`ml-auto border-red-500/30 hover:bg-red-500/10 transition-colors ${
          confirmDelete ? 'text-red-400 border-red-500/50' : 'text-gray-400 hover:text-red-400'
        }`}
        onClick={handleDelete}
        disabled={deleting}
        onBlur={() => setTimeout(() => setConfirmDelete(false), 200)}
      >
        {deleting ? 'Deleting...' : confirmDelete ? 'Confirm Delete' : 'Delete Post'}
      </Button>
    </div>
  )
}
