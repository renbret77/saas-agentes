import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseKey)
        const { priceId, mode, successUrl, cancelUrl, credits } = await req.json()

        const authHeader = req.headers.get("Authorization")
        const { data: { user }, error: authError } = await supabase.auth.getUser(
            authHeader?.split(" ")[1] || ""
        )

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const agencyId = user.user_metadata?.agency_id || (user as any).agency_id

        // Create or get Stripe customer logic can be added here
        // For now, we'll create a session directly

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: mode as any, // 'subscription' or 'payment'
            success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl,
            billing_address_collection: 'required',
            tax_id_collection: {
                enabled: true,
            },
            customer_email: user.email,
            metadata: {
                agency_id: agencyId,
                user_id: user.id,
                type: mode === 'subscription' ? 'subscription' : 'credits',
                credits: credits || "0"
            },
        })

        return NextResponse.json({ url: session.url })
    } catch (error: any) {
        console.error("Error creating stripe session:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
