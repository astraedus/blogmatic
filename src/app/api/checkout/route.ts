import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { priceId } = body

    if (!priceId) {
      return NextResponse.json({ error: 'priceId is required' }, { status: 400 })
    }

    // Validate that the priceId belongs to one of our plans
    const validPriceIds = Object.values(PLANS)
      .map(p => p.priceId)
      .filter(Boolean)

    if (!validPriceIds.includes(priceId)) {
      return NextResponse.json({ error: 'Invalid priceId' }, { status: 400 })
    }

    // Determine plan name from priceId
    const planEntry = Object.entries(PLANS).find(([, plan]) => plan.priceId === priceId)
    const planName = planEntry ? planEntry[0] : 'unknown'

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/dashboard?checkout=cancelled`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        plan: planName,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
