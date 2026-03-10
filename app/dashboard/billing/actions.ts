import { supabase } from '@/lib/supabase'

export async function createCheckoutSession(priceId: string, type: 'subscription' | 'credits' | 'addon') {
    try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error("No estás autenticado")

        const res = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                priceId,
                type,
                // These URLs redirect the user back to the app after Stripe
                successUrl: `${window.location.origin}/dashboard/billing?success=true`,
                cancelUrl: `${window.location.origin}/dashboard/billing?canceled=true`
            })
        })

        if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || "Error al crear sesión de pago")
        }

        return await res.json() // Returns { url: "https://checkout.stripe.com/..." }
    } catch (error: any) {
        console.error("Checkout Error:", error)
        return { error: error.message }
    }
}
