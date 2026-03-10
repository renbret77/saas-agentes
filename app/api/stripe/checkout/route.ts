import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
    try {
        const { priceId, type, cancelUrl, successUrl } = await req.json()

        // 1. Validar Usuario (Propietario de la Agencia)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

        // As cookies auth on the server can be tricky, we expect the client to send the session dynamically 
        // Or we use standard API authorization later. For now, assuming the user is logged in the request contexts
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Get agency
        const { data: profile } = await supabase.from('profiles').select('agency_id').eq('id', user.id).single()
        if (!profile?.agency_id) return NextResponse.json({ error: 'No agency found' }, { status: 400 })

        const agencyId = profile.agency_id

        // 2. Fetch or Create Stripe Customer
        let stripeCustomerId = ""
        const { data: billingInfo } = await supabase.from('billing_customers').select('stripe_customer_id').eq('agency_id', agencyId).single()

        if (billingInfo?.stripe_customer_id) {
            stripeCustomerId = billingInfo.stripe_customer_id
        } else {
            // Create user in Stripe
            const stripeCustomer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    agency_id: agencyId,
                    user_id: user.id
                }
            })
            stripeCustomerId = stripeCustomer.id

            // Save relationship
            await supabase.from('billing_customers').insert({
                agency_id: agencyId,
                stripe_customer_id: stripeCustomerId,
                default_currency: 'mxn' // Or dynamic later
            })
        }

        // 3. Create Checkout Session
        const mode = type === 'subscription' ? 'subscription' : 'payment'

        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            line_items: [{ price: priceId, quantity: 1 }],
            mode: mode,
            success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/billing?success=true`,
            cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/billing?canceled=true`,
            metadata: {
                agency_id: agencyId,
                type: type // 'subscription', 'credits', 'addon'
            }
        })

        return NextResponse.json({ url: session.url })

    } catch (error: any) {
        console.error('Stripe Checkout Error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
