import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { stripe, PLANS, PlanId } from '@/lib/stripe'
import Stripe from 'stripe'

// This route must NOT be behind auth middleware -- Stripe calls it directly
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Use service role client to bypass RLS for webhook updates
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const planId = session.metadata?.plan as PlanId | undefined

        if (!userId || !planId || !(planId in PLANS)) break

        const plan = PLANS[planId]
        await supabase
          .from('profiles')
          .update({
            plan: planId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            monthly_post_limit: plan.postsPerMonth,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find the price ID from the subscription items
        const priceId = subscription.items.data[0]?.price?.id
        if (!priceId) break

        // Map price ID to plan
        const planEntry = Object.entries(PLANS).find(([, p]) => p.priceId === priceId)
        if (!planEntry) break

        const [planId, plan] = planEntry

        await supabase
          .from('profiles')
          .update({
            plan: planId,
            monthly_post_limit: plan.postsPerMonth,
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await supabase
          .from('profiles')
          .update({
            plan: 'free',
            monthly_post_limit: PLANS.free.postsPerMonth,
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)
        break
      }

      default:
        // Unhandled event type -- ok, just return 200
        break
    }
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
