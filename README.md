# Blogmatic

AI-powered SEO blog posts from just your website URL.

**Live**: [blogmatic.vercel.app](https://blogmatic.vercel.app)

## What it does

1. Paste your website URL
2. AI crawls your site -- detects industry, tone, keywords, existing content
3. Generates a fully SEO-optimized blog post in ~30 seconds

Every post includes: title (50-60 chars), meta description (150-155 chars), 5-7 H2 sections, 1500-2000 words, keyword targeting, FAQ section for schema markup, and an SEO score.

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, shadcn/ui
- **Auth + DB**: Supabase (Postgres, Row Level Security, SSR auth)
- **AI**: Google Gemini 2.5 Flash (structured JSON output)
- **Payments**: Stripe (checkout sessions, webhooks, usage tracking)
- **Hosting**: Vercel
- **Testing**: Vitest (28 tests)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in: Supabase URL/keys, Google API key, Stripe keys

# Run the database schema
# Apply supabase/schema.sql to your Supabase project

# Start development server
npm run dev

# Run tests
npm test
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `GOOGLE_API_KEY` | Google AI (Gemini) API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `NEXT_PUBLIC_APP_URL` | App URL (for Stripe redirects) |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/generate` | POST | Analyze URL + generate SEO blog post |
| `/api/posts` | GET | List user's saved posts |
| `/api/posts` | POST | Save a generated post |
| `/api/posts/[id]` | GET | Get a single post |
| `/api/posts/[id]` | DELETE | Delete a post |
| `/api/checkout` | POST | Create Stripe checkout session |
| `/api/webhook` | POST | Handle Stripe webhook events |

## Pricing

| Plan | Price | Posts/month |
|------|-------|-------------|
| Free | $0 | 3 |
| Pro | $29/mo | 20 |
| Agency | $79/mo | 100 |

## License

MIT
