"use client"

import React, { useEffect, useState } from "react"
import { Plus, Search, Shield, Calendar, Building2, User, MessageCircle, CheckCircle2, AlertCircle, ChevronDown, ChevronRight, DollarSign, CreditCard, Info, FileText, Trash2, MessageSquare, Mail } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Database } from "@/types/database.types"
import { getInsurerConfig } from "@/lib/insurers-config"
import { getCollectionMessage } from "@/lib/whatsapp-templates"

type Policy = Database['public']['Tables']['policies']['Row'] & {
    clients: { first_name: string, last_name: string },
    insurers: { name: string, alias: string },
    insurance_lines: { name: string }
}

export default function PoliciesPage() {
    const [policies, setPolicies] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [expandedRow, setExpandedRow] = useState<string | null>(null)

    const formatCurrency = (val: any) => {
        try {
            const num = parseFloat(String(val).replace(/,/g, ''));
            return isNaN(num) ? "0.00" : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } catch { return "0.00"; }
    };

    useEffect(() => {
        fetchPolicies()
    }, [])

    const fetchPolicies = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('policies')
                .select(`
                    *,
                    clients (first_name, last_name, phone),
                    insurers (name, alias),
                    insurance_lines (name),
                    policy_installments (id, installment_number, total_amount, status, whatsapp_sent, whatsapp_status, due_date),
                    policy_documents (id, document_type, file_url, created_at)
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setPolicies(data || [])
        } catch (error) {
            console.error('Error loading policies:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeletePolicy = async (id: string, policyNumber: string) => {
        const confirmPhrase = "eliminar poliza"
        const userInput = prompt(`¿Estás seguro de eliminar la póliza ${policyNumber}? Esta acción es irreversible.\n\nPara confirmar, escribe: ${confirmPhrase}`)

        if (userInput === confirmPhrase) {
            try {
                const { error } = await supabase
                    .from('policies')
                    .delete()
                    .eq('id', id)

                if (error) throw error

                alert("Póliza eliminada exitosamente")
                fetchPolicies() // Recargar lista
            } catch (error: any) {
                console.error('Error delete:', error)
                alert("Error al eliminar: " + error.message)
            }
        } else if (userInput !== null) {
            alert("Confirmación incorrecta. No se eliminó la póliza.")
        }
    }

    const filteredPolicies = policies.filter(policy =>
        (policy.policy_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (policy.clients?.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (policy.clients?.last_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const getComputedStatus = (policy: any) => {
        if (policy.status === 'Cancelada') return { text: 'Cancelada', color: 'bg-slate-100 text-slate-800' }

        const endDate = new Date(policy.end_date)
        endDate.setHours(0, 0, 0, 0)

        const diffTime = endDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays < 0) return { text: 'Vencida', color: 'bg-rose-100 text-rose-800' }
        if (diffDays <= 30) return { text: 'Por Vencer', color: 'bg-amber-100 text-amber-800' }
        return { text: 'Vigente', color: 'bg-emerald-100 text-emerald-800' }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Pólizas</h1>
                    <p className="text-slate-500 mt-1">Administra el inventario de riesgos y vigencias.</p>
                </div>
                <Link href="/dashboard/policies/new" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-lg shadow-emerald-200 active:scale-95">
                    <Plus className="w-5 h-5" />
                    Nueva Póliza
                </Link>
            </div>

            {/* Stats Overview (Mini) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Vigentes</p>
                        <p className="text-2xl font-bold text-slate-900">{policies.filter(p => getComputedStatus(p).text === 'Vigente').length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Por Vencer / Vencidas</p>
                        <p className="text-2xl font-bold text-slate-900">{policies.filter(p => ['Por Vencer', 'Vencida'].includes(getComputedStatus(p).text)).length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Aseguradoras</p>
                        <p className="text-2xl font-bold text-slate-900">{new Set(policies.map(p => p.insurer_id)).size}</p>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por número o cliente..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Policies Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="font-medium">Cargando catálogo de pólizas...</p>
                    </div>
                ) : filteredPolicies.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="bg-slate-50 mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6">
                            <Shield className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">No hay pólizas registradas</h3>
                        <p className="text-slate-500 mt-2 max-w-xs mx-auto">Comienza agregando tu primera póliza para gestionar las vigencias y siniestros.</p>
                        <Link href="/dashboard/policies/new" className="mt-6 inline-flex items-center text-emerald-600 font-semibold hover:underline">
                            Registrar nueva póliza →
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-slate-600 border-collapse">
                            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-widest font-bold text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 w-10"></th>
                                    <th className="px-6 py-4">Póliza / Ramo</th>
                                    <th className="px-6 py-4">Cliente / Contacto</th>
                                    <th className="px-6 py-4">Aseguradora</th>
                                    <th className="px-6 py-4">Prima Total</th>
                                    <th className="px-6 py-4">Vigencia</th>
                                    <th className="px-6 py-4">Recibos</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPolicies.map((policy, index) => {
                                    const isExpanded = expandedRow === policy.id;
                                    const status = getComputedStatus(policy);
                                    const paidInstallments = policy.policy_installments?.length || 0; // Simplificado por ahora

                                    return (
                                        <React.Fragment key={policy.id}>
                                            <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-emerald-50/30 transition-colors group cursor-pointer`} onClick={() => setExpandedRow(isExpanded ? null : policy.id)}>
                                                <td className="px-4 py-5 text-center">
                                                    {isExpanded ? <ChevronDown className="w-4 h-4 text-emerald-600" /> : <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-400" />}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors uppercase">{policy.policy_number}</span>
                                                            {policy.policy_documents?.some((d: any) => d.document_type === 'Carátula') && (
                                                                <a
                                                                    href={policy.policy_documents.find((d: any) => d.document_type === 'Carátula').file_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="text-emerald-600 hover:text-emerald-800 transition-colors"
                                                                    title="Ver Carátula"
                                                                >
                                                                    <FileText className="w-4 h-4" />
                                                                </a>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{policy.insurance_lines?.name || 'Varios'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-700">
                                                            {policy.clients?.first_name} {policy.clients?.last_name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium italic">{policy.clients?.phone || 'Sin Teléfono'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-slate-800">{policy.insurers?.alias || policy.insurers?.name}</span>
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px] font-bold uppercase tracking-tighter w-fit mt-1 border border-blue-100 italic">
                                                            {policy.payment_method}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-bold text-slate-400">{policy.currency}</span>
                                                        <span className="text-sm font-black text-slate-900">${formatCurrency(policy.premium_total)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col text-[10px]">
                                                        <span className="text-slate-500 font-medium italic">Fin: {new Date(policy.end_date).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '10%' }}></div>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-500">1 / {policy.total_installments || 1}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm border
                                                        ${status.color.replace('bg-', 'bg-opacity-20 border-')}`}>
                                                        {status.text}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Link href={`/dashboard/policies/${policy.id}`} onClick={(e) => e.stopPropagation()} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                                        </Link>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeletePolicy(policy.id, policy.policy_number);
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                            title="Eliminar Póliza"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-slate-50 border-x-2 border-emerald-500/20">
                                                    <td colSpan={9} className="px-12 py-6">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-top-2 duration-300">
                                                            <div className="space-y-3">
                                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                                                                    <Info className="w-3 h-3" /> Detalles de Cobertura
                                                                </h4>
                                                                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 shadow-sm">
                                                                    <div className="flex justify-between text-xs">
                                                                        <span className="text-slate-500">Descripción:</span>
                                                                        <span className="font-bold text-slate-800 capitalize">{policy.description || 'N/A'}</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-xs">
                                                                        <span className="text-slate-500">Sub-Ramo:</span>
                                                                        <span className="font-bold text-slate-800">{policy.sub_branch || 'General'}</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-xs">
                                                                        <span className="text-slate-500">Inicio Vigencia:</span>
                                                                        <span className="font-bold text-slate-800">{new Date(policy.start_date).toLocaleDateString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3 col-span-1 md:col-span-2">
                                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 flex items-center gap-2 border-b border-emerald-100 pb-1">
                                                                    <CreditCard className="w-3 h-3" /> Listado de Recibos y Cobranza
                                                                </h4>
                                                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                                                    <table className="w-full text-[10px]">
                                                                        <thead className="bg-slate-50 text-slate-400 font-bold uppercase">
                                                                            <tr>
                                                                                <th className="px-3 py-2">#</th>
                                                                                <th className="px-3 py-2">Vencimiento</th>
                                                                                <th className="px-3 py-2">Importe</th>
                                                                                <th className="px-3 py-2">Estado</th>
                                                                                <th className="px-3 py-2 text-right">Acción</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-100">
                                                                            {policy.policy_installments?.length > 0 ? (
                                                                                policy.policy_installments
                                                                                    .sort((a: any, b: any) => a.installment_number - b.installment_number)
                                                                                    .map((inst: any) => (
                                                                                        <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                                                                                            <td className="px-3 py-2 font-bold text-slate-400">{inst.installment_number}</td>
                                                                                            <td className="px-3 py-2 font-medium">{new Date(inst.due_date).toLocaleDateString()}</td>
                                                                                            <td className="px-3 py-2 font-bold text-slate-900">${formatCurrency(inst.total_amount || 0)}</td>
                                                                                            <td className="px-3 py-2 text-center">
                                                                                                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter shadow-sm border ${inst.status === 'Pagado' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                                                                                    {inst.status || 'Pendiente'}
                                                                                                </span>
                                                                                            </td>
                                                                                            <td className="px-3 py-2 text-right">
                                                                                                <div className="flex items-center justify-end gap-2">
                                                                                                    <button
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            const config = getInsurerConfig(policy.insurer_id || '');
                                                                                                            const graceDays = inst.installment_number === 1 ? (config?.graceDaysFirst ?? 0) : (config?.graceDaysSubsequent ?? 0);
                                                                                                            const clientName = `${policy.clients?.first_name} ${policy.clients?.last_name}`;

                                                                                                            const msg = getCollectionMessage(
                                                                                                                clientName,
                                                                                                                policy.insurance_lines?.name || '',
                                                                                                                policy.insurers?.alias || policy.insurers?.name || '',
                                                                                                                policy.policy_number || '',
                                                                                                                inst.total_amount || 0,
                                                                                                                policy.payment_method as any,
                                                                                                                inst.due_date,
                                                                                                                inst.installment_number,
                                                                                                                policy.policy_installments?.length || 1,
                                                                                                                graceDays,
                                                                                                                policy.sub_branch
                                                                                                            );

                                                                                                            const waLink = `https://wa.me/${policy.clients?.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
                                                                                                            window.open(waLink, '_blank');
                                                                                                        }}
                                                                                                        className="text-[9px] font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded border border-emerald-100 hover:bg-emerald-100 transition-all active:scale-95 flex items-center gap-1"
                                                                                                        title="Cobrar vía WhatsApp"
                                                                                                    >
                                                                                                        <MessageCircle className="w-3 h-3" /> WhatsApp
                                                                                                    </button>
                                                                                                    <button
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            const config = getInsurerConfig(policy.insurer_id || '');
                                                                                                            const graceDays = inst.installment_number === 1 ? (config?.graceDaysFirst ?? 0) : (config?.graceDaysSubsequent ?? 0);
                                                                                                            const clientName = `${policy.clients?.first_name} ${policy.clients?.last_name}`;

                                                                                                            const content = getCollectionMessage(
                                                                                                                clientName,
                                                                                                                policy.insurance_lines?.name || '',
                                                                                                                policy.insurers?.alias || policy.insurers?.name || '',
                                                                                                                policy.policy_number || '',
                                                                                                                inst.total_amount || 0,
                                                                                                                policy.payment_method as any,
                                                                                                                inst.due_date,
                                                                                                                inst.installment_number,
                                                                                                                policy.policy_installments?.length || 1,
                                                                                                                graceDays,
                                                                                                                policy.sub_branch
                                                                                                            );

                                                                                                            const subject = encodeURIComponent(`Recordatorio de Pago: Póliza ${policy.policy_number} - ${policy.insurers?.alias || policy.insurers?.name}`);
                                                                                                            const mailto = `mailto:?subject=${subject}&body=${encodeURIComponent(content)}`;
                                                                                                            window.open(mailto, '_blank');
                                                                                                        }}
                                                                                                        className="p-1 px-2 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all active:scale-95 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest"
                                                                                                        title="Enviar por Correo"
                                                                                                    >
                                                                                                        <Mail className="w-3 h-3" /> Correo
                                                                                                    </button>
                                                                                                </div>
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))
                                                                            ) : (
                                                                                <tr>
                                                                                    <td colSpan={5} className="px-3 py-6 text-center text-slate-400 italic">No hay recibos generados p/ esta póliza</td>
                                                                                </tr>
                                                                            )}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 flex items-center gap-2 border-b border-emerald-100 pb-1">
                                                                    <FileText className="w-3 h-3" /> Endosos y Doc.
                                                                </h4>
                                                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                                                    {policy.policy_documents?.filter((d: any) => d.document_type !== 'Carátula').length > 0 ? (
                                                                        <div className="divide-y divide-slate-100">
                                                                            {policy.policy_documents
                                                                                .filter((d: any) => d.document_type !== 'Carátula')
                                                                                .map((doc: any) => (
                                                                                    <div key={doc.id} className="p-2 flex items-center justify-between hover:bg-slate-50 transition-all">
                                                                                        <div className="flex flex-col">
                                                                                            <span className="text-[10px] font-bold text-slate-700">{doc.document_type}</span>
                                                                                            <span className="text-[8px] text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</span>
                                                                                        </div>
                                                                                        <a
                                                                                            href={doc.file_url}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="text-blue-600 hover:text-blue-800 text-[9px] font-black uppercase tracking-tighter"
                                                                                        >
                                                                                            Ver
                                                                                        </a>
                                                                                    </div>
                                                                                ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="p-4 text-center text-[10px] text-slate-400 italic">
                                                                            Sin endosos registrados
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                        </div>

                                                        {/* Quick Actions Bar */}
                                                        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-1.5 grayscale opacity-70">
                                                                <MessageSquare className="w-3 h-3" /> Canales de Entrega:
                                                            </span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const clientName = `${policy.clients?.first_name} ${policy.clients?.last_name}`;
                                                                    const msg = encodeURIComponent(`✨ *¡BIENVENIDO A TU PROTECCIÓN!* ✨ \n\nHola *${clientName}*, es un gusto saludarte. 👋 \n\nTe confirmo que tu póliza ya está registrada en nuestro sistema: \n\n🏢 *Aseguradora:* ${policy.insurers?.alias || policy.insurers?.name} \n🔢 *Póliza:* *${policy.policy_number}* \n\nQuedo a tus órdenes para cualquier duda. ¡Gracias por tu confianza! 😊`);
                                                                    window.open(`https://wa.me/${policy.clients?.phone?.replace(/\D/g, '')}?text=${msg}`, '_blank');
                                                                }}
                                                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold flex items-center gap-2 hover:bg-black transition-all shadow-md active:scale-95 border border-slate-800"
                                                            >
                                                                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Bienvenida & Carátula
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const clientName = `${policy.clients?.first_name} ${policy.clients?.last_name}`;
                                                                    const msg = encodeURIComponent(`🕒 *AVISO DE RENOVACIÓN* 🕒 \n\nHola *${clientName}*, te informo que tu póliza *${policy.policy_number}* está próxima a renovarse. \n\n¿Gustas que revisemos las nuevas condiciones? 😊`);
                                                                    window.open(`https://wa.me/${policy.clients?.phone?.replace(/\D/g, '')}?text=${msg}`, '_blank');
                                                                }}
                                                                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                                                            >
                                                                <Shield className="w-3.5 h-3.5 text-amber-500" /> Aviso Renovación
                                                            </button>
                                                            {policy.notes && (
                                                                <div className="flex-1 min-w-[200px] p-2 bg-amber-50/50 rounded-xl border border-amber-100/50 text-[10px] text-amber-800 italic leading-tight shadow-inner">
                                                                    <strong className="text-amber-900 uppercase">Nota:</strong> {policy.notes}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
