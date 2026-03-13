"use client"

import React, { useEffect, useState } from "react"
import { 
    Search, 
    Calendar, 
    MessageCircle, 
    RefreshCw, 
    Filter, 
    Download,
    AlertCircle,
    CheckCircle2,
    Clock,
    CreditCard,
    FileText,
    TrendingUp,
    ChevronRight,
    ArrowUpRight
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { 
    getCollectionMessage, 
    getPreRenewalMessage, 
    generateWhatsAppLink, 
    PaymentMethod 
} from "@/lib/whatsapp-templates"
import { getInsurerConfig } from "@/lib/insurers-config"

export default function RecibosPage() {
    const [installments, setInstallments] = useState<any[]>([])
    const [policies, setPolicies] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "overdue" | "renewals">("all")

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch installments with policy and client info
            const { data: instData, error: instError } = await supabase
                .from('policy_installments')
                .select(`
                    *,
                    policies (
                        id,
                        policy_number,
                        payment_method,
                        currency,
                        sub_branch,
                        insurer_id,
                        clients (first_name, last_name, phone, whatsapp),
                        insurers (alias, name),
                        insurance_lines (name)
                    ),
                    policy_documents (
                        id,
                        file_url,
                        document_type
                    )
                `)
                .order('due_date', { ascending: true })

            if (instError) throw instError

            // Fetch policies for direct renewals (those without installments or specifically expiring)
            const { data: polData, error: polError } = await supabase
                .from('policies')
                .select(`
                    id,
                    policy_number,
                    end_date,
                    premium_total,
                    payment_method,
                    sub_branch,
                    insurer_id,
                    clients (first_name, last_name, phone, whatsapp),
                    insurers (alias, name),
                    insurance_lines (name)
                `)

            if (polError) throw polError

            setInstallments(instData || [])
            setPolicies(polData || [])
        } catch (error) {
            console.error("Error fetching receipts data:", error)
        } finally {
            setLoading(false)
        }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const receiptsList = installments.map(inst => {
        const dueDate = new Date(inst.due_date)
        dueDate.setHours(0, 0, 0, 0)
        
        const diffTime = dueDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        const isOverdue = diffDays < 0 && inst.status !== 'Pagado'
        
        return {
            type: 'installment',
            id: inst.id,
            policyId: inst.policies?.id,
            policyNumber: inst.policies?.policy_number,
            clientName: `${inst.policies?.clients?.first_name} ${inst.policies?.clients?.last_name}`,
            clientPhone: inst.policies?.clients?.whatsapp || inst.policies?.clients?.phone,
            insurer: inst.policies?.insurers?.alias || inst.policies?.insurers?.name,
            amount: inst.total_amount,
            dueDate: inst.due_date,
            installmentNumber: inst.installment_number,
            totalInstallments: inst.policies?.total_installments,
            status: inst.status,
            diffDays,
            isOverdue,
            insuranceLine: inst.policies?.insurance_lines?.name,
            paymentMethod: inst.policies?.payment_method,
            subBranch: inst.policies?.sub_branch,
            insurerId: inst.policies?.insurer_id,
            documentUrl: inst.policy_documents?.[0]?.file_url // v36: Link al recibo específico
        }
    })

    // Add renewals that are within 30 days
    const renewalsList = policies.filter(p => {
        const endDate = new Date(p.end_date)
        endDate.setHours(0, 0, 0, 0)
        const diffTime = endDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays <= 45 // Show renewals up to 45 days ahead
    }).map(p => {
        const endDate = new Date(p.end_date)
        endDate.setHours(0, 0, 0, 0)
        const diffTime = endDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        return {
            type: 'renewal',
            id: `renewal-${p.id}`,
            policyId: p.id,
            policyNumber: p.policy_number,
            clientName: `${p.clients?.first_name} ${p.clients?.last_name}`,
            clientPhone: p.clients?.whatsapp || p.clients?.phone,
            insurer: p.insurers?.alias || p.insurers?.name,
            amount: p.premium_total,
            dueDate: p.end_date,
            status: 'Próxima',
            installmentNumber: 0,
            totalInstallments: 0,
            diffDays,
            isOverdue: diffDays < 0,
            insuranceLine: p.insurance_lines?.name,
            paymentMethod: p.payment_method,
            subBranch: p.sub_branch,
            insurerId: p.insurer_id,
            documentUrl: null
        }
    })

    const combinedList = [...receiptsList, ...renewalsList].sort((a, b) => {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })

    const filteredList = combinedList.filter(item => {
        const matchesSearch = item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             item.policyNumber.toLowerCase().includes(searchTerm.toLowerCase())
        
        if (filterStatus === 'pending') return matchesSearch && !item.isOverdue && item.status !== 'Pagado'
        if (filterStatus === 'overdue') return matchesSearch && item.isOverdue && item.status !== 'Pagado'
        if (filterStatus === 'renewals') return matchesSearch && item.type === 'renewal'
        
        return matchesSearch
    })

    const handleSendWhatsApp = (item: any) => {
        let msg = ""
        if (item.type === 'renewal') {
            msg = getPreRenewalMessage(
                item.clientName,
                item.insuranceLine || 'Seguro',
                item.insurer,
                item.policyNumber,
                item.dueDate,
                item.amount
            )
        } else {
            const config = getInsurerConfig(item.insurerId || '');
            const graceDays = item.installmentNumber === 1 ? (config?.graceDaysFirst ?? 0) : (config?.graceDaysSubsequent ?? 0);
            
            msg = getCollectionMessage(
                item.clientName,
                item.insuranceLine || '',
                item.insurer,
                item.policyNumber,
                item.amount,
                item.paymentMethod as PaymentMethod,
                item.dueDate,
                item.installmentNumber,
                item.totalInstallments || 1,
                graceDays,
                item.subBranch,
                item.documentUrl // v36: Pasar el link del recibo si existe
            )
        }

        const link = generateWhatsAppLink(item.clientPhone || '', msg)
        window.open(link, '_blank')
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Legend / Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-amber-100 text-amber-600 rounded-2xl">
                            <CreditCard className="w-7 h-7" />
                        </div>
                        Calendario de <span className="text-amber-600">Recibos</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Control total de cobranza y renovaciones pendientes.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchData}
                        className="p-3 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-2xl transition-all border border-transparent hover:border-amber-100"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="h-10 w-px bg-slate-200 mx-2" />
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                        {(['all', 'pending', 'overdue', 'renewals'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    filterStatus === s 
                                    ? 'bg-white text-slate-900 shadow-sm' 
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {s === 'all' ? 'Todos' : s === 'pending' ? 'Próximos' : s === 'overdue' ? 'Vencidos' : 'Renovaciones'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Pendientes", value: receiptsList.filter(r => !r.isOverdue && r.status !== 'Pagado').length, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Vencidos", value: receiptsList.filter(r => r.isOverdue && r.status !== 'Pagado').length, color: "text-rose-600", bg: "bg-rose-50" },
                    { label: "Renovaciones (30d)", value: renewalsList.filter(r => r.diffDays <= 30 && r.diffDays >= 0).length, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Total mes", value: `$${receiptsList.reduce((acc, curr) => acc + (curr.status !== 'Pagado' ? curr.amount : 0), 0).toLocaleString()}`, color: "text-slate-900", bg: "bg-slate-50" },
                ].map((stat, i) => (
                    <div key={i} className={`p-6 rounded-3xl border border-slate-100 ${stat.bg} shadow-sm`}>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                        <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Main List */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Buscar por cliente o póliza..."
                            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                        <Download className="w-4 h-4" /> Exportar Reporte
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">
                                <th className="px-8 py-4">Vencimiento</th>
                                <th className="px-8 py-4">Tipo</th>
                                <th className="px-8 py-4">Cliente / Póliza</th>
                                <th className="px-8 py-4">Aseguradora</th>
                                <th className="px-8 py-4">Importe</th>
                                <th className="px-8 py-4">Estado</th>
                                <th className="px-8 py-4 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-sm font-bold text-slate-500">Analizando recibos...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredList.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 max-w-xs mx-auto">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                                <AlertCircle className="w-10 h-10" />
                                            </div>
                                            <p className="text-slate-900 font-bold">Sin resultados</p>
                                            <p className="text-xs text-slate-500 leading-relaxed italic">No se encontraron recibos o renovación que coincidan con los filtros aplicados.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredList.map((item, idx) => (
                                    <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors group ${item.isOverdue && item.status !== 'Pagado' ? 'bg-rose-50/10' : ''}`}>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-black ${item.isOverdue && item.status !== 'Pagado' ? 'text-rose-600' : 'text-slate-900'}`}>
                                                    {new Date(item.dueDate).toLocaleDateString()}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                    {item.diffDays === 0 ? 'Hoy' : item.diffDays > 0 ? `En ${item.diffDays} días` : `Vencido hace ${Math.abs(item.diffDays)}d`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-1.2
                                                ${item.type === 'renewal' 
                                                    ? 'bg-rose-100 text-rose-700 border-rose-200 shadow-[0_2px_10px_rgba(225,29,72,0.1)]' 
                                                    : 'bg-amber-100 text-amber-700 border-amber-200 shadow-[0_2px_10px_rgba(245,158,11,0.1)]'
                                                }`}>
                                                {item.type === 'renewal' ? <RefreshCw className="w-2.5 h-2.5" /> : <CreditCard className="w-2.5 h-2.5" />}
                                                {item.type === 'renewal' ? 'Renovación' : `Recibo ${item.installmentNumber}/${item.totalInstallments}`}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors uppercase">{item.clientName}</span>
                                                <span className="text-[10px] text-slate-400 font-medium italic">Póliza: {item.policyNumber}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-800">{item.insurer}</span>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-tighter font-bold">{item.insuranceLine || 'Varios'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-sm font-black text-slate-900">${Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </td>
                                         <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase shadow-sm border
                                                    ${item.status === 'Pagado' 
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                        : item.isOverdue ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                                    {item.status || (item.type === 'renewal' ? 'Próxima' : 'Pendiente')}
                                                </span>
                                                {item.documentUrl && (
                                                    <div className="p-1 px-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[8px] font-black uppercase flex items-center gap-1 animate-pulse" title="Recibo PDF disponible">
                                                        <FileText className="w-2.5 h-2.5" /> PDF
                                                    </div>
                                                )}
                                                {!item.documentUrl && item.type === 'installment' && !item.isOverdue && item.diffDays <= 5 && (
                                                    <div className="p-1 px-1.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[8px] font-black uppercase flex items-center gap-1" title="Falta subir recibo">
                                                        <AlertCircle className="w-2.5 h-2.5" /> FALTÓ
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button 
                                                onClick={() => handleSendWhatsApp(item)}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-200 active:scale-95 group/btn"
                                            >
                                                <MessageCircle className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                                Enviar Aviso
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer / Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-8 border-t border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 rounded-2xl">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-900">Estrategia de Cobranza RB</p>
                        <p className="text-[10px] text-slate-500">Mantenemos tu cartera limpia y al día con IA.</p>
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <p className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-widest">v.1.0 RC - Premium Access</p>
                </div>
            </div>
        </div>
    )
}
