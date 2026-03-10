// lib/stripe.ts
import Stripe from 'stripe'

// We add a fallback dummy key 'sk_test_...' so the Vercel build doesn't crash
// if you haven't added the real environment variable yet.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_123', {
    typescript: true,
})
