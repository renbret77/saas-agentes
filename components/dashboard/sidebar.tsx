"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { supabase } from '@/lib/supabase'
import {
    LayoutDashboard,
    Users,
    FileText,
    RefreshCw,
    CreditCard,
    Settings,
    ShieldCheck,
    LogOut,
    Menu,
    Shield,
    TrendingUp,
    ShieldAlert,
    Target,
    Heart,
    Sparkles,
    Coins,
    Zap,
    Gift,
    Terminal
} from "lucide-react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { UpsellModal } from "./upsell-modal"

const menuItems = [
    { icon: LayoutDashboard, label: "Resumen", href: "/dashboard" },
    { icon: Users, label: "Clientes", href: "/dashboard/clients" },
    { icon: Sparkles, label: "Cotizaciones", href: "/dashboard/quotes" },
    { icon: TrendingUp, label: "CRM / Pipeline", href: "/dashboard/pipeline" },
    { icon: Target, label: "Venta Cruzada", href: "/dashboard/cross-sell" },
    { icon: FileText, label: "Pólizas", href: "/dashboard/policies" },
    { icon: Heart, label: "Fidelización", href: "/dashboard/loyalty" },
    { icon: TrendingUp, label: "Reportes", href: "/dashboard/reports" },
    { icon: ShieldAlert, label: "Siniestros", href: "/dashboard/claims" },
    { icon: Shield, label: "Aseguradoras", href: "/dashboard/insurers" },
    { icon: RefreshCw, label: "Migración SICAS", href: "/dashboard/import" },
    { icon: Terminal, label: "Centro de Comando", href: "/dashboard/admin" },
    { icon: CreditCard, label: "Cobranza", href: "/dashboard/billing" },
    { icon: Settings, label: "Configuración", href: "/dashboard/settings" },
]

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [credits, setCredits] = useState({ total: 0, used: 0 })
    const [userRole, setUserRole] = useState<string>("agent")
    const [licenseType, setLicenseType] = useState<string>("free")
    const [permissions, setPermissions] = useState<any>(null)
    const [userName, setUserName] = useState<string>("Usuario")

    const [upsellModalOpen, setUpsellModalOpen] = useState(false)
    const [upsellRoute, setUpsellRoute] = useState("")

    const PRO_FEATURES = [
        "/dashboard/cross-sell",
        "/dashboard/loyalty",
        "/dashboard/reports",
        "/dashboard/claims",
        "/dashboard/quotes"
    ]

    useEffect(() => {
        fetchUserData()
    }, [])

    const fetchUserData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('agent_settings')
            .select('ai_credits_total, ai_credits_used')
            .eq('user_id', user.id)
            .single()

        if (data) {
            setCredits({
                total: (data as any).ai_credits_total || 10,
                used: (data as any).ai_credits_used || 0
            })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select(`
                full_name,
                role,
                agencies ( license_type )
            `)
            .eq('id', user.id)
            .single()

        if (profile) {
            setUserRole((profile as any).role)
            setUserName((profile as any).full_name || user.email || "Usuario")
            setLicenseType((profile as any).agencies?.license_type || 'free')
            if ((profile as any).role === 'assistant') {
                const { data: perms } = await supabase.from('assistant_permissions').select('*').eq('assistant_id', user.id).single()
                if (perms) {
                    setPermissions(perms as any)
                }
            }
        }
    }

    const filteredMenuItems = menuItems.filter(item => {
        if (userRole !== 'assistant') return true;
        if (item.href === '/dashboard/admin') return false;

        const p = permissions || {};
        if (item.href === '/dashboard/billing' && !p.can_view_financials) return false;
        if (item.href === '/dashboard/reports' && !p.can_view_financials) return false;
        if (item.href === '/dashboard/clients' && !p.can_manage_clients) return false;
        if (item.href === '/dashboard/cross-sell' && !p.can_manage_clients) return false;
        if (item.href === '/dashboard/loyalty' && !p.can_manage_clients) return false;
        if (item.href === '/dashboard/claims' && !p.can_manage_claims) return false;
        if (item.href === '/dashboard/quotes' && !p.can_manage_quotes) return false;

        return true;
    })

    const handleMenuClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        // Intercept Pro Features for Free users
        if (licenseType === 'free' && PRO_FEATURES.includes(href)) {
            e.preventDefault() // Detener navegación
            setUpsellRoute(href)
            setUpsellModalOpen(true)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const creditsRemaining = credits.total - credits.used

    return (
        <>
            {/* Mobile Toggle */}
            <div className="lg:hidden p-4 flex items-center justify-between bg-white border-b">
                <div className="flex items-center gap-2 text-emerald-600 font-bold">
                    <ShieldCheck className="h-6 w-6" />
                    <span>RB Proyectos</span>
                </div>
                <button onClick={() => setIsMobileOpen(!isMobileOpen)}>
                    <Menu className="h-6 w-6 text-slate-600" />
                </button>
            </div>

            {/* Sidebar Container */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen flex flex-col",
                isMobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>

                {/* Logo Area */}
                <Link href="/dashboard" className="h-24 flex flex-col justify-center px-6 border-b border-slate-800 hover:bg-slate-800/50 transition-colors group">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="h-7 w-7 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="text-lg font-bold tracking-tight">RB Proyectos</span>
                    </div>
                    <div className="mt-2 px-3 py-0.5 bg-rose-600/10 border border-rose-500/20 rounded-full w-fit">
                        <span className="text-[9px] font-black text-rose-400 tracking-tighter uppercase leading-none flex items-center gap-1.5">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                            </span>
                            BUILD 11/MAR 18:15
                        </span>
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                    {filteredMenuItems.map((item) => {
                        const isActive = pathname === item.href
                        const isProFeature = PRO_FEATURES.includes(item.href)
                        const showProLock = licenseType === 'free' && isProFeature

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={(e) => handleMenuClick(e, item.href)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-emerald-600/10 text-emerald-400 font-medium shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5", isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-white")} />
                                <span>{item.label}</span>

                                {showProLock && (
                                    <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[9px] font-black text-amber-500 tracking-wider">
                                        <Sparkles className="w-2.5 h-2.5" /> PRO
                                    </div>
                                )}

                                {isActive && !showProLock && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400"
                                    />
                                )}
                            </Link>
                        )
                    })}

                    {userRole === 'superadmin' && (
                        <div className="pt-4 mt-6 border-t border-slate-200/50">
                            <p className="px-3 mb-2 text-[10px] font-black tracking-widest text-indigo-400 uppercase">Propietario</p>
                            <Link
                                href="/dashboard/superadmin"
                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group
                                    ${pathname.startsWith('/dashboard/superadmin') ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-medium'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-100 text-indigo-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
                                    </div>
                                    {!isMobileOpen && <span className="text-sm">Súper Admin</span>}
                                </div>
                            </Link>
                        </div>
                    )}
                </nav>

                {/* Referral Promo Banner */}
                <div className="px-6 mb-4">
                    <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/10 border border-emerald-500/20 rounded-2xl p-4 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <Gift className="w-3 h-3" /> Gana Créditos
                            </p>
                            <p className="text-xs text-slate-300 mb-3 leading-snug">Invita a un colega y recibe **50 créditos** gratis.</p>
                            <Link
                                href="/dashboard/billing"
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-500 transition-colors"
                            >
                                Invitar Ahora
                            </Link>
                        </div>
                        <Gift className="absolute -bottom-2 -right-2 w-16 h-16 text-emerald-500/10 -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                    </div>
                </div>

                {/* User / Footer */}
                <div className="mt-auto p-4 bg-slate-950 border-t border-slate-800/50 flex flex-col gap-4 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
                    {/* Credits Widget */}
                    <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <Coins className="w-3.5 h-3.5 text-amber-400" /> Créditos AI
                            </div>
                            <span className="text-[10px] font-bold text-emerald-400 px-1.5 py-0.5 bg-emerald-400/10 rounded-md">PRO</span>
                        </div>
                        <div className="space-y-2">
                            <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(creditsRemaining / credits.total) * 100}%` }}
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-300">{creditsRemaining} disponibles</span>
                                <Link href="/dashboard/billing" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> Recargar
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-500 flex items-center justify-center text-sm font-bold uppercase">
                            {userName.substring(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{userName}</p>
                            <p className="text-xs text-slate-400 truncate capitalize">{userRole}</p>
                        </div>
                        <button onClick={handleLogout} className="text-slate-400 hover:text-rose-400 transition-colors">
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>

            </div>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
            {/* Freemium Upsell Modal */}
            <UpsellModal
                isOpen={upsellModalOpen}
                onClose={() => setUpsellModalOpen(false)}
                featureRoute={upsellRoute}
            />
        </>
    )
}
