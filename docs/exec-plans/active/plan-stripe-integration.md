# Plan: Stripe Payment Integration + Tests

## Goal
Add Stripe subscriptions, usage enforcement, and a Vitest test suite to Blogmatic.

## Steps
- [x] Read playbook, lessons, existing code
- [ ] Write src/lib/stripe.ts — Stripe singleton + PLANS config
- [ ] Write src/app/api/checkout/route.ts — POST create checkout session
- [ ] Write src/app/api/webhook/route.ts — POST handle Stripe events
- [ ] Update src/app/page.tsx — pricing CTAs trigger checkout
- [ ] Update src/app/api/generate/route.ts — auth check + usage enforcement
- [ ] Update src/app/api/posts/route.ts — increment posts_generated_this_month on POST
- [ ] Update src/app/dashboard/page.tsx — show usage + upgrade CTA
- [ ] Update .env.local — real STRIPE_SECRET_KEY
- [ ] Install vitest + testing-library
- [ ] Write vitest.config.ts
- [ ] Write src/test/setup.ts
- [ ] Write src/lib/__tests__/stripe.test.ts
- [ ] Write src/lib/__tests__/analyzer.test.ts
- [ ] Write src/app/api/__tests__/generate.test.ts
- [ ] Write src/app/api/__tests__/posts.test.ts
- [ ] Update package.json test scripts
- [ ] Run npm run build — must pass
- [ ] Run npm test — report results

## Decisions
- Stripe API version: 2026-02-25.clover (what stripe@20.4.1 ships with)
- Webhook uses request.text() for raw body (required for signature verification)
- Supabase service role client for webhook DB writes (bypasses RLS)
- Landing page pricing: client-side checkout initiation via fetch → /api/checkout
- Usage limits: free=3, pro=20, agency=100 (per spec)
