export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  pro: 50,
  agency: 200,
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch profile, sites, and recent posts in parallel
  const [profileResult, sitesResult, postsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('sites').select('*').eq('user_id', user.id),
    supabase
      .from('posts')
      .select('*, sites(name, url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const profile = profileResult.data
  const sites = sitesResult.data || []
  const posts = postsResult.data || []

  const postsThisMonth = profile?.posts_generated_this_month ?? 0
  const planLimit = profile ? PLAN_LIMITS[profile.plan] ?? 3 : 3
  const plan = profile?.plan ?? 'free'

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'published': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'draft': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'archived': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Welcome back, {user.email?.split('@')[0]}
          </p>
        </div>
        <Link href="/dashboard/generate">
          <Button className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white border-0">
            Generate New Post
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-white/5 border-white/10 p-6">
          <p className="text-gray-400 text-sm font-medium mb-2">Posts This Month</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{postsThisMonth}</span>
            <span className="text-gray-500 text-sm mb-1">/ {planLimit}</span>
          </div>
          <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-violet-600 rounded-full transition-all"
              style={{ width: `${Math.min((postsThisMonth / planLimit) * 100, 100)}%` }}
            />
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 p-6">
          <p className="text-gray-400 text-sm font-medium mb-2">Connected Sites</p>
          <span className="text-3xl font-bold text-white">{sites.length}</span>
          <p className="text-gray-500 text-sm mt-2">
            {sites.length === 0 ? 'Add your first site' : `${sites.length} site${sites.length > 1 ? 's' : ''} configured`}
          </p>
        </Card>

        <Card className="bg-white/5 border-white/10 p-6">
          <p className="text-gray-400 text-sm font-medium mb-2">Current Plan</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-white capitalize">{plan}</span>
          </div>
          {plan === 'free' && (
            <Link href="/dashboard/settings#billing">
              <p className="text-blue-400 text-sm mt-2 hover:text-blue-300 cursor-pointer">
                Upgrade to Pro
              </p>
            </Link>
          )}
        </Card>
      </div>

      {/* Recent posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Posts</h2>
          <Link href="/dashboard/posts">
            <Button variant="ghost" className="text-gray-400 hover:text-white text-sm h-8">
              View all
            </Button>
          </Link>
        </div>

        {posts.length === 0 ? (
          <Card className="bg-white/5 border-white/10 border-dashed p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-white font-medium mb-1">No posts yet</p>
            <p className="text-gray-500 text-sm mb-4">Generate your first AI-powered SEO blog post</p>
            <Link href="/dashboard/generate">
              <Button className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white border-0">
                Generate Post
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-white font-medium text-sm truncate">{post.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-gray-500 text-xs">
                      {(post.sites as { name?: string; url?: string } | null)?.name || 'Unknown site'}
                    </span>
                    <span className="text-gray-600 text-xs">{formatDate(post.created_at)}</span>
                    {post.word_count && (
                      <span className="text-gray-600 text-xs">{post.word_count.toLocaleString()} words</span>
                    )}
                    {post.seo_score && (
                      <span className="text-gray-600 text-xs">SEO: {Math.round(post.seo_score)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(post.status)}`}>
                    {post.status}
                  </span>
                  <Link href={`/dashboard/posts/${post.id}`}>
                    <Button variant="ghost" className="text-gray-400 hover:text-white h-8 px-3 text-xs">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
