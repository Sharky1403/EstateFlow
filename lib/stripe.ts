import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function createPaymentIntent(amount: number, customerId: string) {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    customer: customerId,
    automatic_payment_methods: { enabled: true },
  })
}

export async function createStripeCustomer(email: string, name: string) {
  return stripe.customers.create({ email, name })
}
