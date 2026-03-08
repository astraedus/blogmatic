'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

const FEATURES = [
  {
    title: 'SEO Optimized',
    description: 'Every post is crafted with proper keyword density, meta descriptions, and heading structure that search engines love.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    title: 'Industry-Aware',
    description: "AI analyzes your site to understand your industry and produce content that speaks your audience's language.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    title: 'One-Click Export',
    description: 'Download as Markdown, copy as HTML, or publish directly. Your content, your way.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
  },
  {
    title: 'Keyword Targeting',
    description: 'Specify target keywords or let AI discover the best opportunities based on your existing content.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    title: 'Readable Content',
    description: 'Clean, well-structured posts with proper flow, subheadings, and FAQ sections that keep readers engaged.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: 'Bulk Generation',
    description: 'Build out your content calendar in one session. Generate months of posts for multiple sites in minutes.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
]

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Try it out, no credit card needed.',
    features: [
      '3 posts per month',
      '1 connected site',
      'Markdown export',
      'SEO score analysis',
    ],
    cta: 'Get Started',
    priceId: null,
    signupHref: '/auth/signup',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: 'per month',
    description: 'For founders and solo marketers scaling content.',
    features: [
      '20 posts per month',
      '5 connected sites',
      'All export formats',
      'Priority generation',
      'Keyword research',
      'Custom tone settings',
    ],
    cta: 'Subscribe',
    priceId: 'price_1T8pff5hmcn4NulJ6g7pLnBS',
    signupHref: '/auth/signup?plan=pro',
    highlight: true,
  },
  {
    name: 'Agency',
    price: '$79',
    period: 'per month',
    description: 'For agencies managing multiple client sites.',
    features: [
      '100 posts per month',
      'Unlimited sites',
      'White-label exports',
      'Team seats (3)',
      'Priority support',
      'Bulk scheduling',
    ],
    cta: 'Subscribe',
    priceId: 'price_1T8pfm5hmcn4NulJD9WajWNy',
    signupHref: '/auth/signup?plan=agency',
    highlight: false,
  },
]

const STEPS = [
  {
    number: '01',
    title: 'Paste your URL',
    description: 'Enter your website URL. No setup or configuration required.',
  },
  {
    number: '02',
    title: 'AI analyzes your site',
    description: 'Our AI reads your content, detects your industry, tone, and identifies keyword opportunities.',
  },
  {
    number: '03',
    title: 'Get SEO-ready posts',
    description: 'Receive a fully written, optimized blog post in under 30 seconds. Export and publish.',
  },
]

export default function LandingPage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [subscribingPlan, setSubscribingPlan] = useState<string | null>(null)

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    router.push(`/auth/signup?url=${encodeURIComponent(url)}`)
  }

  async function handleSubscribe(priceId: string, signupHref: string) {
    setSubscribingPlan(priceId)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push(signupHref)
        return
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setSubscribingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-white">
      {/* Gradient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute top-32 right-1/4 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/2 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 h-16 border-b border-white/[0.06] backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">B</span>
          </div>
          <span className="text-white font-semibold">Blogmatic</span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-gray-400 hover:text-white text-sm h-9 px-4">
              Sign in
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white border-0 text-sm h-9 px-4">
              Get started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-24 pb-20 px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 text-sm text-gray-300">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Powered by Gemini 2.5 Flash
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto">
          AI-Powered SEO Blog Posts
          <span className="block bg-gradient-to-r from-blue-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
            in Seconds
          </span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Paste your website URL. Our AI analyzes your site, detects your industry and tone, then generates
          fully optimized blog posts that rank.
        </p>

        {/* URL Input */}
        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-6">
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourwebsite.com"
            className="flex-1 bg-white/5 border-white/20 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20 h-12 text-base"
          />
          <Button
            type="submit"
            disabled={loading || !url.trim()}
            className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white border-0 h-12 px-6 font-medium text-base whitespace-nowrap"
          >
            {loading ? 'Analyzing...' : 'Generate Post'}
          </Button>
        </form>

        <p className="text-gray-600 text-sm">
          Join 500+ businesses automating their content. No credit card required.
        </p>
      </section>

      {/* Social proof strip */}
      <section className="relative z-10 border-y border-white/[0.06] bg-white/[0.02] py-6 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-sm text-gray-500">
          <span>Trusted by founders at</span>
          {['Y Combinator', 'Product Hunt', 'Indie Hackers', 'Shopify', 'Vercel'].map((brand) => (
            <span key={brand} className="font-medium text-gray-400">{brand}</span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 mb-4">
              How it works
            </Badge>
            <h2 className="text-4xl font-bold">From URL to published post in 3 steps</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="relative">
                <div className="text-6xl font-bold text-white/5 mb-4">{step.number}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="border-violet-500/30 text-violet-400 bg-violet-500/10 mb-4">
              Features
            </Badge>
            <h2 className="text-4xl font-bold">Everything you need to rank</h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto">
              Built specifically for SEO content, not just generic AI writing.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-600/20 border border-white/10 flex items-center justify-center mb-4 text-blue-400">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 mb-4">
              Pricing
            </Badge>
            <h2 className="text-4xl font-bold">Simple, transparent pricing</h2>
            <p className="text-gray-400 mt-4">Start free. Upgrade when you need more.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 border ${
                  plan.highlight
                    ? 'bg-gradient-to-b from-blue-500/10 to-violet-600/10 border-blue-500/40 shadow-lg shadow-blue-500/10'
                    : 'bg-white/[0.03] border-white/[0.08]'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-violet-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-500 text-sm">/ {plan.period}</span>
                  </div>
                  <p className="text-gray-400 text-sm">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.priceId ? (
                  <Button
                    onClick={() => handleSubscribe(plan.priceId!, plan.signupHref)}
                    disabled={subscribingPlan === plan.priceId}
                    className={`w-full h-11 font-medium ${
                      plan.highlight
                        ? 'bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white border-0'
                        : 'bg-white/5 hover:bg-white/10 text-white border-white/20 hover:border-white/30'
                    }`}
                    variant={plan.highlight ? 'default' : 'outline'}
                  >
                    {subscribingPlan === plan.priceId ? 'Loading...' : plan.cta}
                  </Button>
                ) : (
                  <Link href={plan.signupHref}>
                    <Button
                      className="w-full h-11 font-medium bg-white/5 hover:bg-white/10 text-white border-white/20 hover:border-white/30"
                      variant="outline"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Start writing content that
            <span className="block bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              actually ranks
            </span>
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Join hundreds of businesses that have replaced their content agencies with Blogmatic.
            3 free posts to get you started.
          </p>
          <Link href="/auth/signup">
            <Button className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white border-0 h-12 px-8 text-base font-medium">
              Get started for free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">B</span>
            </div>
            <span className="text-white font-medium text-sm">Blogmatic</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Contact</span>
          </div>

          <p className="text-gray-600 text-sm">
            2026 Blogmatic. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
