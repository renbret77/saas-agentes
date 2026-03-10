import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.text()
    const signature = req.headers.get('Stripe-Signature') as string

    let event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (err: any) {
        console.error(`Webhook signature verification failed.`, err.message)
        return NextResponse.json({ error: err.message }, { status: 400 })
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object as any

                // Retrieve the metadata we passed when creating the checkout
                const agencyId = session.metadata?.agency_id
                const purchaseType = session.metadata?.type // 'subscription', 'credits', 'addon'

                if (!agencyId) throw new Error("Agency ID missing in metadata")

                if (purchaseType === 'subscription') {
                    // Update agency license
                    await supabaseAdmin
                        .from('agencies')
                        .update({
                            license_type: 'pro',
                            status: 'active',
                            max_users: 10,
                            max_clients: 9999,
                            max_policies: 9999
                        })
                        .eq('id', agencyId)

                    // Update subscriptions table
                    await supabaseAdmin
                        .from('subscriptions')
                        .insert({
                            agency_id: agencyId,
                            stripe_subscription_id: session.subscription as string,
                            stripe_price_id: session.metadata?.price_id || 'unknown',
                            status: 'active',
                            current_period_start: new Date(Date.now()).toISOString(),
                            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        })

                } else if (purchaseType === 'credits') {
                    // Logic to add credits to the agency
                    console.log(`Bought credits for agency ${agencyId}`)
                    // (Assuming you have an `ai_credits` column in agencies)
                    // await supabaseAdmin.rpc('increment_agency_credits', { p_agency_id: agencyId, p_amount: 50 })
                }

                // Log transaction
                await supabaseAdmin.from('transactions').insert({
                    agency_id: agencyId,
                    stripe_payment_intent_id: session.payment_intent as string || session.id,
                    amount_subtotal: session.amount_subtotal,
                    amount_total: session.amount_total,
                    currency: session.currency,
                    status: 'succeeded',
                    metadata: session.metadata
                })

                break

            case 'customer.subscription.deleted':
                const subscription = event.data.object as any

                // Find agency and downgrade to free
                const { data: subData } = await supabaseAdmin
                    .from('subscriptions')
                    .select('agency_id')
                    .eq('stripe_subscription_id', subscription.id)
                    .single()

                if (subData?.agency_id) {
                    await supabaseAdmin
                        .from('agencies')
                        .update({
                            license_type: 'free',
                            max_users: 1,
                            max_clients: 20,
                            max_policies: 20
                        })
                        .eq('id', subData.agency_id)

                    await supabaseAdmin
                        .from('subscriptions')
                        .update({ status: 'canceled' })
                        .eq('stripe_subscription_id', subscription.id)
                }
                break

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }
    } catch (err: any) {
        console.error('Error processing webhook event', err)
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }

    return NextResponse.json({ received: true })
}
