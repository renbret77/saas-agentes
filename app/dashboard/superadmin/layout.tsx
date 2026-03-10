"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ShieldAlert } from 'lucide-react'

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (!profile || (profile as any).role !== 'superadmin') {
                router.push('/dashboard')
                return
            }

            setIsAuthorized(true)
        }

        checkAuth()
    }, [router])

    if (isAuthorized === null) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <ShieldAlert className="w-12 h-12 text-indigo-300 animate-pulse mb-4" />
                <p className="text-slate-500 font-medium">Autenticando Nivel de Propietario...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            {children}
        </div>
    )
}
