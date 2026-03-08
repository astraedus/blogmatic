import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const PLANS = {
  free: { name: 'Free', price: 0, postsPerMonth: 3, priceId: null },
  pro: { name: 'Pro', price: 29, postsPerMonth: 20, priceId: 'price_1T8pff5hmcn4NulJ6g7pLnBS' },
  agency: { name: 'Agency', price: 79, postsPerMonth: 100, priceId: 'price_1T8pfm5hmcn4NulJD9WajWNy' },
} as const

export type PlanId = keyof typeof PLANS
