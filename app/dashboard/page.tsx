"use client"

import { useEffect, useState } from "react"
import { Users, FileText, DollarSign, Activity, TrendingUp, ArrowUpRight, Plus, Sparkles, MessageSquare, Download, Video, Loader2, Target, Quote, Star } from "lucide-react"
import { supabase } from "@/lib/supabase"
import RenewalAlerts from "@/components/dashboard/overview/renewal-alerts"
import BranchDistribution from "@/components/dashboard/overview/branch-distribution"
import CollectionTimeline from "@/components/dashboard/overview/collection-timeline"
import OpportunityAIWidget from "@/components/dashboard/OpportunityAIWidget"
import OpportunitiesCenter from "@/components/dashboard/OpportunitiesCenter"
import ClientProtectionMap from "@/components/dashboard/ClientProtectionMap"
import { OnboardingTour } from "@/components/dashboard/onboarding-tour"
import CapatazStatusWidget from "@/components/dashboard/CapatazStatusWidget"
import CriticalTasksWidget from "@/components/dashboard/CriticalTasksWidget"
import ClaimsTrackingWidget from "@/components/dashboard/ClaimsTrackingWidget"
import RemindersWidget from "@/components/dashboard/RemindersWidget"
import VoiceCommandInterface from "@/components/dashboard/VoiceCommandInterface"
import VideoProposalManager from "@/components/dashboard/VideoProposalManager"
import QuotaUsageWidget from "@/components/dashboard/QuotaUsageWidget"
import Link from "next/link"
import { generateAgentExecutiveSummary, fetchAgentSummaryData } from "@/lib/agent-summary-generator"
import AIBriefingWidget from "@/components/dashboard/AIBriefingWidget"
import SuperQuotePreview from "@/components/dashboard/SuperQuotePreview"

export default function DashboardPage() {
    const [stats, setStats] = useState({
        clients: 0,
        policies: 0,
        premiums: 0,
        claims: 0
    })
    const [policiesData, setPoliciesData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const { count: clientCount, error: clientError } = await supabase
                    .from('clients')
                    .select('*', { count: 'exact', head: true })

                const { data: policies, error: policyError } = await supabase
                    .from('policies')
                    .select(`
                        id, 
                        policy_number, 
                        status, 
                        premium_net, 
                        premium_total, 
                        payment_method,
                        start_date, 
                        end_date,
                        sub_branch,
                        notes,
                        total_installments,
                        current_installment,
                        payment_link,
                        is_domiciled,
                        policy_fee,
                        surcharge_amount,
                        discount_amount,
                        vat_amount,
                        clients (first_name, last_name, phone, email),
                        insurers (alias, name),
                        insurance_lines (name)
                    `)

                if (clientError) throw clientError
                if (policyError) throw policyError

                const allPolicies = (policies as any[]) || []
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                let activePoliciesCount = 0
                let totalPremiumsCurrentMonth = 0
                const currentMonth = today.getMonth()
                const currentYear = today.getFullYear()

                allPolicies.forEach((p: any) => {
                    const endDate = new Date(p.end_date)
                    endDate.setHours(0, 0, 0, 0)
                    const startDate = new Date(p.start_date)

                    if (endDate >= today && p.status !== 'Cancelada') {
                        activePoliciesCount++
                    }

                    if (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) {
                        totalPremiumsCurrentMonth += (Number(p.premium_net) || 0)
                    }
                })

                setStats({
                    clients: clientCount || 0,
                    policies: activePoliciesCount,
                    premiums: totalPremiumsCurrentMonth,
                    claims: 0
                })

                setPoliciesData(allPolicies)

            } catch (error: any) {
                console.error('Error fetching dashboard data:', error.message)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

    return (
        <div className="relative min-h-screen space-y-8 pb-32">
            {/* Mesh Gradient Background (Subtle) */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]"></div>
                <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-blue-500/5 rounded-full blur-[120px]"></div>
            </div>

            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-200">En Conexión</span>
                        <span className="text-slate-400 text-[10px] font-medium underline decoration-slate-200 underline-offset-4">ID Agency: RB-2026-X</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Focus <span className="text-emerald-600">Center</span></h1>
                    <p className="text-slate-500 font-medium max-w-2xl">
                        El sistema que te ayuda a ganar más dinero, detectar oportunidades, ahorrar tiempo y <span className="text-indigo-600 font-bold italic">trabaja mejor que tú</span>.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={async () => {
                            try {
                                const data = await fetchAgentSummaryData("Rene Breton"); // Hardcoded for now, should come from auth
                                const blob = await generateAgentExecutiveSummary(data);
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `Resumen_Ejecutivo_${new Date().toISOString().split('T')[0]}.pdf`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                URL.revokeObjectURL(url);
                            } catch (error) {
                                console.error("Error generating report:", error);
                                alert("Ocurrió un error al generar el reporte ejecutivo.");
                            }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95 h-9"
                    >
                        <FileText className="w-3 h-3" /> Reporte Ejecutivo
                    </button>
                    <button
                        onClick={async () => {
                            const { data: clients } = await supabase.from('clients').select('*');
                            const { data: policies } = await supabase.from('policies').select('*');

                            const downloadCSV = (data: any[], filename: string) => {
                                if (!data || data.length === 0) return;
                                const headers = Object.keys(data[0]).join(',');
                                const rows = data.map(row =>
                                    Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
                                );
                                const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
                                const encodedUri = encodeURI(csvContent);
                                const link = document.createElement("a");
                                link.setAttribute("href", encodedUri);
                                link.setAttribute("download", filename);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            };

                            if (clients) downloadCSV(clients, `respaldo_clientes_${new Date().toISOString().split('T')[0]}.csv`);
                            if (policies) downloadCSV(policies, `respaldo_polizas_${new Date().toISOString().split('T')[0]}.csv`);
                            alert("✅ Respaldo generado. Se han descargado 2 archivos CSV con toda tu información.");
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition-all shadow-sm active:scale-95 h-9"
                    >
                        <Download className="w-3 h-3" /> Exportar Todo
                    </button>
                    <Link href="/dashboard/import" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95 h-9">
                        <ArrowUpRight className="w-3 h-3" /> Importar SICAS
                    </Link>
                    <Link href="/quote/presentation/auto-demo" className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-200 active:scale-95 h-9">
                        <Star className="w-3 h-3" /> Presentación Omni Elite
                    </Link>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 h-9">
                        <Plus className="w-3 h-3" /> Nueva Cotización
                    </button>
                </div>
            </div>

            {/* Main Dashboard Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">

                {/* Left Column: Metrics & Main Stats */}
                <div className="xl:col-span-3 space-y-8">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: "Clientes Activos", value: stats.clients, trend: "+12%", color: "text-blue-600", bg: "bg-blue-50" },
                            { label: "Pólizas Vigentes", value: stats.policies, trend: "+5.3%", color: "text-emerald-600", bg: "bg-emerald-50" },
                            { label: "Prima Nueva (Mes)", value: `$${stats.premiums.toLocaleString()}`, trend: "+24%", color: "text-amber-600", bg: "bg-amber-50" },
                        ].map((stat, i) => (
                            <div key={i} className="group bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all relative overflow-hidden">
                                <div className={`absolute top-0 right-0 p-4 ${stat.color} opacity-10 group-hover:scale-110 transition-transform`}>
                                    <TrendingUp className="w-12 h-12" />
                                </div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{stat.label}</p>
                                <div className="flex items-end gap-3">
                                    <p className="text-4xl font-black text-slate-900 tracking-tight">{loading ? "..." : stat.value}</p>
                                    <div className={`flex items-center text-[10px] font-black px-1.5 py-0.5 rounded-lg ${stat.bg} ${stat.color} mb-1.5 shadow-sm`}>
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                        {stat.trend}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Zona Focus: Siniestros y Renovaciones */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <OpportunitiesCenter />
                        <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                            <RenewalAlerts policies={policiesData} />
                        </div>
                    </div>

                    {/* Mapa de Protección & Tareas Críticas */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        <div className="lg:col-span-1">
                            <ClientProtectionMap policies={policiesData} />
                        </div>
                        <div className="lg:col-span-2">
                            <CriticalTasksWidget />
                        </div>
                    </div>
                </div>

                {/* Right Column: AI Hub & Widgets */}
                <div className="xl:col-span-1 space-y-8">
                    {/* Executive Briefing NEW */}
                    <AIBriefingWidget />

                    {/* Super Cotizador RPA Preview NEW */}
                    <SuperQuotePreview />

                    {/* Recordatorios IA */}
                    <RemindersWidget />
                    
                    {/* Seguimiento del Plan (v84) */}
                    <QuotaUsageWidget />

                    <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <ClaimsTrackingWidget />
                    </div>
                </div>
            </div>

            {/* Sales Intelligence & Engagement (Full Width Section Below) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 pb-20">
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            IA de Crecimiento
                            <Sparkles className="w-4 h-4 text-amber-500" />
                        </h3>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black border border-amber-100">
                             PERSUASIÓN ACTIVA
                        </div>
                    </div>
                    <OpportunityAIWidget />
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            Video Engagement
                            <Video className="w-4 h-4 text-indigo-500" />
                        </h3>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black border border-indigo-100">
                             V-PROP
                        </div>
                    </div>
                    <VideoProposalManager />
                </div>
            </div>

            {/* Modern Floating Action Bar */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-slate-900/90 backdrop-blur-xl rounded-full border border-slate-700 shadow-2xl z-40 animate-in slide-in-from-bottom-10 duration-1000">
                <button
                    onClick={() => alert("🪄 Magic Creator: Esta funcionalidad de IA está en fase de entrenamiento (Beta). Se habilitará próximamente para generar cotizaciones inteligentes con Capataz.")}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full text-xs font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-950/20 active:scale-95"
                >
                    <Sparkles className="w-4 h-4" /> Magic Creator
                </button>
                <div className="w-px h-6 bg-slate-700"></div>
                <button className="p-3 hover:bg-slate-800 rounded-full text-slate-300 transition-colors" onClick={() => alert("Bitácora de IA - Próximamente")}>
                    <MessageSquare className="w-5 h-5" />
                </button>
                <button className="p-3 hover:bg-slate-800 rounded-full text-slate-300 transition-colors" onClick={() => alert("Historial de Actividad - Próximamente")}>
                    <Activity className="w-5 h-5" />
                </button>
            </div>

            <OnboardingTour />
        </div>
    )
}
