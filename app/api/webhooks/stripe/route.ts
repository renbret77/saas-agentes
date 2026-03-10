import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
    try {
        const payload = await req.text()
        const sig = req.headers.get("stripe-signature")!

        let event
        try {
            event = stripe.webhooks.constructEvent(payload, sig, endpointSecret)
        } catch (err: any) {
            console.error("Webhook signature verification failed:", err.message)
            return NextResponse.json({ error: "Webhook Error" }, { status: 400 })
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as any
            const metadata = session.metadata
            const agencyId = metadata.agency_id
            const userId = metadata.user_id

            if (metadata.type === 'credits') {
                const creditsToAdd = parseInt(metadata.credits || "0")

                // Update user_credits balance
                const { error: creditError } = await (supabase
                    .from('user_credits') as any)
                    .upsert({
                        user_id: userId,
                        balance: (await fetchCurrentBalance(supabase, userId)) + creditsToAdd,
                        updated_at: new Date().toISOString()
                    })

                if (creditError) throw creditError

                // Log the transaction
                await (supabase.from('transactions') as any).insert({
                    agency_id: agencyId,
                    stripe_payment_intent_id: session.payment_intent,
                    amount_total: session.amount_total,
                    currency: session.currency,
                    description: `IA Credits Top-up: ${creditsToAdd} credits`,
                    status: 'succeeded',
                    metadata: metadata
                })
            } else if (metadata.type === 'subscription') {
                // Update subscription table
                await (supabase.from('subscriptions') as any).upsert({
                    agency_id: agencyId,
                    stripe_subscription_id: session.subscription,
                    stripe_price_id: session.line_items?.data[0]?.price.id,
                    status: 'active',
                    current_period_start: new Date().toISOString(),
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
                })
            }
        }

        return NextResponse.json({ received: true })
    } catch (error: any) {
        console.error("Webhook processing error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

async function fetchCurrentBalance(supabase: any, userId: string): Promise<number> {
    const { data } = await supabase.from('user_credits').select('balance').eq('user_id', userId).single()
    return data?.balance || 0
}
