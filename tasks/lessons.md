# Blogmatic — Project Lessons

## Stack
- Next.js 14 + Tailwind v3 + shadcn v2 (new-york style)
- Supabase SSR auth pattern: `await createClient()` from `@/lib/supabase/server`
- Dashboard layout handles auth redirect — individual pages don't need to redirect if under /dashboard/

## Patterns

### Server auth in API routes
Always call `supabase.auth.getUser()` and check `user` before touching DB.
Return `{ error: 'Unauthorized' }` with status 401 if missing.

### Server auth in pages
`redirect('/auth/login')` if no user. Use `notFound()` for missing DB records.

### Client pages in Next.js 14
Add `export const dynamic = 'force-dynamic'` to client pages that depend on auth/Supabase.

### Markdown rendering
No `marked` or `react-markdown` installed — use simple regex-based renderMarkdown() utility.
Pattern exists in generate/page.tsx and posts/[id]/page.tsx — keep in sync or extract to a shared utility if a third consumer appears.

### ESLint: no-unused-vars
Next.js build runs ESLint; unused imports cause build failure. Always remove unused imports.

### Supabase ownership guard on DELETE
Always verify `user_id = user.id` on both the select check AND the delete query to prevent IDOR.
