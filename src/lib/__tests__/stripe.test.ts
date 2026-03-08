import { describe, it, expect, vi } from 'vitest'

// Mock Stripe to avoid the 'apiKey required' error when importing stripe.ts
// Must use 'function' (not arrow) since Stripe is instantiated with 'new'
vi.mock('stripe', () => {
  function MockStripe() {
    return {
      checkout: { sessions: { create: vi.fn() } },
      webhooks: { constructEvent: vi.fn() },
    }
  }
  return { default: MockStripe }
})

// Import PLANS after the mock is in place
const { PLANS } = await import('../stripe')

describe('PLANS config', () => {
  it('has correct structure for all plans', () => {
    expect(PLANS).toHaveProperty('free')
    expect(PLANS).toHaveProperty('pro')
    expect(PLANS).toHaveProperty('agency')
  })

  it('free plan has correct limits', () => {
    expect(PLANS.free.postsPerMonth).toBe(3)
    expect(PLANS.free.price).toBe(0)
    expect(PLANS.free.priceId).toBeNull()
  })

  it('pro plan has correct limits', () => {
    expect(PLANS.pro.postsPerMonth).toBe(20)
    expect(PLANS.pro.price).toBe(29)
    expect(PLANS.pro.priceId).toBeDefined()
    expect(PLANS.pro.priceId).not.toBeNull()
  })

  it('agency plan has correct limits', () => {
    expect(PLANS.agency.postsPerMonth).toBe(100)
    expect(PLANS.agency.price).toBe(79)
    expect(PLANS.agency.priceId).toBeDefined()
    expect(PLANS.agency.priceId).not.toBeNull()
  })

  it('paid plans have price IDs defined', () => {
    expect(PLANS.pro.priceId).toBe('price_1T8pff5hmcn4NulJ6g7pLnBS')
    expect(PLANS.agency.priceId).toBe('price_1T8pfm5hmcn4NulJD9WajWNy')
  })

  it('each plan has a name', () => {
    expect(PLANS.free.name).toBe('Free')
    expect(PLANS.pro.name).toBe('Pro')
    expect(PLANS.agency.name).toBe('Agency')
  })

  it('postsPerMonth values are in ascending order', () => {
    expect(PLANS.free.postsPerMonth).toBeLessThan(PLANS.pro.postsPerMonth)
    expect(PLANS.pro.postsPerMonth).toBeLessThan(PLANS.agency.postsPerMonth)
  })
})
