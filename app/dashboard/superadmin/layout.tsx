import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Proteger la ruta: Solo SuperAdmins
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || (profile as any).role !== 'superadmin') {
        // Log unauthorized attempt silently and kick them out
        redirect('/dashboard')
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            {children}
        </div>
    )
}
