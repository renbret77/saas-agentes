"use client"

import React, { useEffect, useState } from "react"
import { Plus, Search, Shield, Calendar, Building2, User, MessageCircle, CheckCircle2, AlertCircle, ChevronDown, ChevronRight, DollarSign, CreditCard, Info, FileText, Trash2, MessageSquare, Mail, RefreshCw, Link as LinkIcon, Users, Check, Mail as MailIcon } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Database } from "@/types/database.types"
import { getInsurerConfig } from "@/lib/insurers-config"
import { getCollectionMessage, getWelcomeMessage, getPreRenewalMessage, getRenewedMessage, getDirectLinkMessage, getPaymentCalendarMessage, getBrandedViewerLink, generateWhatsAppLink } from "@/lib/whatsapp-templates"
import { generatePolicyCalendarPDF } from "@/lib/pdf-generator"

type Policy = Database['public']['Tables']['policies']['Row'] & {
    clients: { first_name: string, last_name: string },
    insurers: { name: string, alias: string },
    insurance_lines: { name: string }
}

export default function PoliciesPage() {
    const [policies, setPolicies] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState("Vigente")
    const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null)

    // v2.5: Notificaciones Multi-Medio
    const [showContactSelector, setShowContactSelector] = useState(false)
    const [selectorConfig, setSelectorConfig] = useState<{
        type: 'whatsapp' | 'email',
        message: string,
        subject?: string,
        clientData: any
    } | null>(null)
    const [generatingPDF, setGeneratingPDF] = useState<string | null>(null) // v34: ID de la póliza en proceso
    
    // v35: Borrado Seguro de Documentos
    const [deletingDocId, setDeletingDocId] = useState<string | null>(null)
    const [deletePhrase, setDeletePhrase] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)

    const formatCurrency = (val: any) => {
        try {
            const num = parseFloat(String(val).replace(/,/g, ''));
            return isNaN(num) ? "0.00" : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } catch { return "0.00"; }
    };

    useEffect(() => {
        fetchPolicies()
    }, [])

    const handleDeleteDocument = async (docId: string) => {
        if (deletePhrase !== 'borrar') return;
        
        try {
            setIsDeleting(true);
            const { error } = await supabase
                .from('policy_documents')
                .delete()
                .eq('id', docId);

            if (error) throw error;
            
            setDeletingDocId(null);
            setDeletePhrase("");
            fetchPolicies();
        } catch (err: any) {
            console.error("Error deleting document:", err);
            alert("Error al borrar el documento: " + err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const fetchPolicies = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('policies')
                .select(`
                    *,
                    clients (first_name, last_name, phone, whatsapp, additional_phones, additional_emails),
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
                                    const isExpanded = expandedPolicy === policy.id;
                                    const status = getComputedStatus(policy);
                                    
                                    // Lógica de Pre-Renovación (30 días antes)
                                    const endDate = new Date(policy.end_date);
                                    const diffTime = endDate.getTime() - today.getTime();
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    const isPreRenewalWindow = diffDays <= 30 && diffDays >= 0;

                                    return (
                                        <React.Fragment key={policy.id}>
                                            <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-emerald-50/30 transition-colors group cursor-pointer`} onClick={() => setExpandedPolicy(isExpanded ? null : policy.id)}>
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
                                                        <span className="text-[10px] text-slate-400 font-medium italic">{policy.clients?.phone || policy.clients?.whatsapp || 'Sin Teléfono'}</span>
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
                                                                                                            );                                                                                setSelectorConfig({
                                                                                    type: 'whatsapp',
                                                                                    message: msg,
                                                                                    clientData: policy.clients
                                                                                });
                                                                                setShowContactSelector(true);
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
                                                                                                            );                                                                                setSelectorConfig({
                                                                                    type: 'email',
                                                                                    message: content,
                                                                                    subject: `Recordatorio de Pago: Póliza ${policy.policy_number} - ${policy.insurers?.alias || policy.insurers?.name}`,
                                                                                    clientData: policy.clients
                                                                                });
                                                                                setShowContactSelector(true);
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
                                                                    {policy.policy_documents?.length > 0 ? (
                                                                        <div className="divide-y divide-slate-100">
                                                                            {policy.policy_documents
                                                                                .map((doc: any) => (
                                                                                    <div key={doc.id} className="p-2 flex items-center justify-between hover:bg-slate-50 transition-all">
                                                                                        <div className="flex flex-col">
                                                                                            <span className="text-[10px] font-bold text-slate-700">{doc.document_type}</span>
                                                                                            <span className="text-[8px] text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</span>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <a
                                                                                                href={doc.file_url}
                                                                                                target="_blank"
                                                                                                rel="noreferrer"
                                                                                                className="p-1.5 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-all"
                                                                                                title="Ver documento"
                                                                                            >
                                                                                                <ChevronRight className="w-4 h-4" />
                                                                                            </a>
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    setDeletingDocId(doc.id);
                                                                                                    setDeletePhrase("");
                                                                                                }}
                                                                                                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                                                                                                title="Borrar documento"
                                                                                            >
                                                                                                <Trash2 className="w-4 h-4" />
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="p-4 text-center text-[10px] text-slate-400 italic">
                                                                            Sin documentos registrados. <Link href={`/dashboard/policies/${policy.id}?step=5`} className="text-blue-600 hover:text-blue-800 underline not-italic">Subir manual</Link>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                        </div>

                                                        {/* Quick Actions Bar */}
                                                        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-1.5 grayscale opacity-70">
                                                                <MessageSquare className="w-3 h-3" /> Acciones Rápidas:
                                                            </span>

                                                            {/* Botón: Bienvenida (Alta Nueva) */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const clientName = `${policy.clients?.first_name} ${policy.clients?.last_name}`;
                                                                    const installments = policy.policy_installments || [];
                                                                    const firstInst = installments.find((i: any) => i.installment_number === 1)?.total_amount || 0;
                                                                    const subInst = installments.find((i: any) => i.installment_number === 2)?.total_amount || 0;
                                                                    const limitDateFirst = installments.find((i: any) => i.installment_number === 1)?.due_date || policy.start_date;

                                                                    const welcomeMsg = getWelcomeMessage(
                                                                        clientName,
                                                                        policy.policy_number,
                                                                        policy.insurers?.alias || policy.insurers?.name,
                                                                        policy.insurance_lines?.name || 'Seguro',
                                                                        policy.payment_method || 'Contado',
                                                                        policy.start_date,
                                                                        policy.end_date,
                                                                        policy.premium_total,
                                                                        firstInst,
                                                                        subInst,
                                                                        limitDateFirst,
                                                                        policy.policy_documents?.find((d: any) => d.document_type === 'Carátula')?.file_url || 'https://api.whatsapp.com/send?text=Documento_no_disponible',
                                                                        policy.currency === 'USD' ? 'USD$' : '$'
                                                                    );

                                                                    setSelectorConfig({
                                                                        type: 'whatsapp',
                                                                        message: welcomeMsg,
                                                                        clientData: policy.clients
                                                                    });
                                                                    setShowContactSelector(true);
                                                                }}
                                                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold flex items-center gap-2 hover:bg-black transition-all shadow-md active:scale-95 border border-slate-800"
                                                                title="Enviar mensaje de bienvenida con enlace a carátula"
                                                            >
                                                                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Bienvenida & Carátula
                                                            </button>

                                                            {/* Botón: Calendario de Pagos (v34 - Con PDF y Upload) */}
                                                            <button
                                                                disabled={generatingPDF === policy.id}
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    try {
                                                                        setGeneratingPDF(policy.id);
                                                                        const clientName = `${policy.clients?.first_name} ${policy.clients?.last_name}`;
                                                                        const installments = policy.policy_installments || [];

                                                                        // 1. Generar PDF Blob (v35: Pasar end_date para los periodos)
                                                                        const pdfBlob = generatePolicyCalendarPDF(
                                                                            clientName,
                                                                            policy.policy_number,
                                                                            policy.insurers?.alias || policy.insurers?.name,
                                                                            installments,
                                                                            policy.currency || 'MXN',
                                                                            policy.end_date
                                                                        );

                                                                        // 2. Subir a Supabase Storage
                                                                        const fileName = `calendario_${policy.policy_number}_${Date.now()}.pdf`;
                                                                        const filePath = `${policy.client_id}/${fileName}`;

                                                                        const { data: uploadData, error: uploadError } = await supabase.storage
                                                                            .from('client_docs')
                                                                            .upload(filePath, pdfBlob);

                                                                        if (uploadError) throw uploadError;

                                                                        // 3. Obtener URL Pública
                                                                        const { data: { publicUrl } } = supabase.storage
                                                                            .from('client_docs')
                                                                            .getPublicUrl(filePath);

                                                                        // 4. Registrar en DB (Carpeta del cliente)
                                                                        const { error: dbError } = await supabase
                                                                            .from('policy_documents')
                                                                            .insert({
                                                                                policy_id: policy.id,
                                                                                name: `Calendario de Pagos - ${policy.policy_number}`,
                                                                                document_type: 'Calendario de Pagos',
                                                                                file_url: publicUrl,
                                                                                notes: 'Generado automáticamente'
                                                                            });

                                                                        if (dbError) throw dbError;

                                                                        // 5. Preparar Mensaje con Link Branded
                                                                        const brandedLink = getBrandedViewerLink(publicUrl, clientName, 'Calendario de Pagos', policy.id);

                                                                        const msg = [
                                                                            getPaymentCalendarMessage(
                                                                                clientName,
                                                                                policy.policy_number,
                                                                                installments,
                                                                                policy.currency === 'USD' ? 'USD$' : '$'
                                                                            ),
                                                                            '',
                                                                            `*TU DOCUMENTO DIGITAL:*`,
                                                                            brandedLink
                                                                        ].join('\n');

                                                                        setSelectorConfig({
                                                                            type: 'whatsapp',
                                                                            message: msg,
                                                                            clientData: policy.clients
                                                                        });
                                                                        setShowContactSelector(true);
                                                                        fetchPolicies(); // Recargar para que aparezca en la lista de docs
                                                                    } catch (err: any) {
                                                                        console.error("Error generating/uploading PDF:", err);
                                                                        alert("Error al generar el calendario: " + err.message);
                                                                    } finally {
                                                                        setGeneratingPDF(null);
                                                                    }
                                                                }}
                                                                className={`px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-black flex items-center gap-2 hover:bg-emerald-50 transition-all shadow-sm active:scale-95 ${generatingPDF === policy.id ? 'opacity-50 cursor-wait' : ''}`}
                                                                title="Generar PDF y enviar desglose de recibos"
                                                            >
                                                                <Calendar className={`w-3.5 h-3.5 ${generatingPDF === policy.id ? 'animate-bounce' : ''}`} />
                                                                {generatingPDF === policy.id ? 'Generando...' : 'Calendario de Pagos'}
                                                            </button>

                                                            {/* Botón: Pre-Renovación (Recordatorio 30 días) */}
                                                            {isPreRenewalWindow && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const clientName = `${policy.clients?.first_name} ${policy.clients?.last_name}`;
                                                                        const msg = getPreRenewalMessage(
                                                                            clientName,
                                                                            policy.insurance_lines?.name || 'Seguro',
                                                                            policy.insurers?.alias || policy.insurers?.name || '',
                                                                            policy.policy_number,
                                                                            policy.end_date,
                                                                            policy.premium_total
                                                                        );

                                                                        setSelectorConfig({
                                                                            type: 'whatsapp',
                                                                            message: msg,
                                                                            clientData: policy.clients
                                                                        });
                                                                        setShowContactSelector(true);
                                                                    }}
                                                                    className="px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-bold flex items-center gap-2 hover:bg-amber-600 transition-all shadow-md active:scale-95"
                                                                    title="Recordatorio de renovación (Faltan 30 días o menos)"
                                                                >
                                                                    <RefreshCw className="w-3.5 h-3.5" /> Recordatorio Renovación
                                                                </button>
                                                            )}

                                                            {/* Botón: Póliza Renovada (Confirmación) */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const clientName = `${policy.clients?.first_name} ${policy.clients?.last_name}`;
                                                                    const installments = policy.policy_installments || [];
                                                                    const firstInst = installments.find((i: any) => i.installment_number === 1)?.total_amount || 0;
                                                                    const subInst = installments.find((i: any) => i.installment_number === 2)?.total_amount || 0;
                                                                    const limitDateFirst = installments.find((i: any) => i.installment_number === 1)?.due_date || policy.start_date;

                                                                    const renewedMsg = getRenewedMessage(
                                                                        clientName,
                                                                        policy.policy_number,
                                                                        policy.insurers?.alias || policy.insurers?.name,
                                                                        policy.insurance_lines?.name || 'Seguro',
                                                                        policy.payment_method || 'Contado',
                                                                        policy.start_date,
                                                                        policy.end_date,
                                                                        policy.premium_total,
                                                                        firstInst,
                                                                        subInst,
                                                                        limitDateFirst,
                                                                        policy.policy_documents?.find((d: any) => d.document_type === 'Carátula')?.file_url || 'https://api.whatsapp.com/send?text=Documento_no_disponible',
                                                                        policy.currency === 'USD' ? 'USD$' : '$'
                                                                    );

                                                                    setSelectorConfig({
                                                                        type: 'whatsapp',
                                                                        message: renewedMsg,
                                                                        clientData: policy.clients
                                                                    });
                                                                    setShowContactSelector(true);
                                                                }}
                                                                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                                                                title="Entregar carátula de renovación"
                                                            >
                                                                <Shield className="w-3.5 h-3.5 text-blue-500" /> Póliza Renovada
                                                            </button>

                                                            {/* Botón: Link Directo (v31) */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const clientName = `${policy.clients?.first_name} ${policy.clients?.last_name}`;
                                                                    const policyLink = policy.policy_documents?.find((d: any) => d.document_type === 'Carátula')?.file_url || 'Link_no_disponible';

                                                                    const msg = getDirectLinkMessage(clientName, policyLink);

                                                                    setSelectorConfig({
                                                                        type: 'whatsapp',
                                                                        message: msg,
                                                                        clientData: policy.clients
                                                                    });
                                                                    setShowContactSelector(true);
                                                                }}
                                                                className="px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black flex items-center gap-2 hover:bg-emerald-100 transition-all shadow-sm active:scale-95"
                                                                title="Pica este link: Envía solo el acceso directo a la póliza"
                                                            >
                                                                <LinkIcon className="w-3.5 h-3.5" /> Link Directo
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

            {/* Version Footer */}
            <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded uppercase tracking-widest">v.11-03-2026 08:30 PM</span>
                <span className="text-[10px] font-bold text-slate-300">© 2026 Portal SaaS</span>
            </div>

            {/* Modal Selección de Contacto (v2.5) */}
            {showContactSelector && selectorConfig && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    {selectorConfig.type === 'whatsapp' ? (
                                        <div className="p-2 bg-emerald-100 rounded-2xl text-emerald-600">
                                            <MessageSquare className="w-6 h-6" />
                                        </div>
                                    ) : (
                                        <div className="p-2 bg-blue-100 rounded-2xl text-blue-600">
                                            <MailIcon className="w-6 h-6" />
                                        </div>
                                    )}
                                    Enviar {selectorConfig.type === 'whatsapp' ? 'WhatsApp' : 'Correo'}
                                </h3>
                                <p className="text-slate-500 font-medium mt-1">Selecciona el destinatario de la lista</p>
                            </div>
                            <button
                                onClick={() => setShowContactSelector(false)}
                                className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-all active:scale-90"
                            >
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-50/30">
                            {(() => {
                                const contacts = []
                                const client = selectorConfig.clientData

                                if (selectorConfig.type === 'whatsapp') {
                                    if (client.whatsapp) contacts.push({ name: `${client.first_name} (WhatsApp)`, value: client.whatsapp, type: 'Primario', isAlert: true })
                                    if (client.mobile_phone && client.mobile_phone !== client.whatsapp) contacts.push({ name: `${client.first_name} (Móvil)`, value: client.mobile_phone, type: 'Secundario' })

                                    // v3.0: WhatsApp Adicionales
                                    const additional = (client.additional_phones as any[]) || []
                                    additional.forEach(ap => {
                                        if (ap.phone) contacts.push({ name: ap.name || 'WhatsApp Adicional', value: ap.phone, type: 'Persistente', isAlert: ap.notify })
                                    })
                                } else {
                                    if (client.email) contacts.push({ name: `${client.first_name} (Principal)`, value: client.email, type: 'Primario', isAlert: true })
                                    if (client.secondary_email) contacts.push({ name: `${client.first_name} (Alternativo)`, value: client.secondary_email, type: 'Secundario' })

                                    // v3.0: Correo Adicionales
                                    const additional = (client.additional_emails as any[]) || []
                                    additional.forEach(ae => {
                                        if (ae.email) contacts.push({ name: ae.name || 'Correo Adicional', value: ae.email, type: 'Persistente', isAlert: ae.notify })
                                    })
                                }

                                const related = (client.related_contacts as any[]) || []
                                related.forEach(c => {
                                    const val = selectorConfig.type === 'whatsapp' ? c.phone : c.email
                                    if (val) contacts.push({ name: c.name, value: val, type: c.relation || 'Relacionado', isAlert: c.notify })
                                })

                                return contacts.length > 0 ? contacts.map((contact, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            if (selectorConfig.type === 'whatsapp') {
                                                const link = generateWhatsAppLink(contact.value, selectorConfig.message)
                                                window.open(link, '_blank')
                                            } else {
                                                const link = `mailto:${contact.value}?subject=${encodeURIComponent(selectorConfig.subject || '')}&body=${encodeURIComponent(selectorConfig.message)}`
                                                window.open(link, '_blank')
                                            }
                                            setShowContactSelector(false)
                                        }}
                                        className="w-full flex items-center justify-between p-5 mb-4 bg-white border border-slate-100 rounded-[1.5rem] hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 transition-all group active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                                {selectorConfig.type === 'whatsapp' ? <MessageSquare className="w-6 h-6" /> : <MailIcon className="w-6 h-6" />}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{contact.name}</p>
                                                <p className="text-xs text-slate-500 font-medium">{contact.value}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {contact.isAlert && (
                                                <span className="px-2 py-0.5 bg-emerald-100 text-[9px] font-black text-emerald-700 rounded-md border border-emerald-200">ALERTA</span>
                                            )}
                                            <span className="px-3 py-1 bg-slate-100 text-[10px] font-black text-slate-600 rounded-full uppercase tracking-tighter">
                                                {contact.type}
                                            </span>
                                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-all group-hover:translate-x-1" />
                                        </div>
                                    </button>
                                )) : (
                                    <div className="py-12 text-center">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                            <AlertCircle className="w-8 h-8" />
                                        </div>
                                        <p className="text-slate-500 font-medium italic">No se encontraron {selectorConfig.type === 'whatsapp' ? 'teléfonos' : 'correos'} disponibles.</p>
                                    </div>
                                )
                            })()}
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest"> RB Proyectos • Sistema de Notificaciones </p>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal de Borrado Seguro (v35) */}
            {deletingDocId && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">¿Seguro que deseas borrarlo?</h3>
                            <p className="text-sm text-slate-500 font-medium mb-6">Esta acción es irreversible. Para confirmar, escribe la palabra <span className="text-rose-600 font-black italic">borrar</span> abajo:</p>

                            <input
                                type="text"
                                value={deletePhrase}
                                onChange={(e) => setDeletePhrase(e.target.value.toLowerCase())}
                                placeholder='Escribe "borrar" para confirmar'
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 mb-6 transition-all"
                                autoFocus
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setDeletingDocId(null);
                                        setDeletePhrase("");
                                    }}
                                    className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleDeleteDocument(deletingDocId)}
                                    disabled={deletePhrase !== 'borrar' || isDeleting}
                                    className={`flex-1 px-6 py-3 bg-rose-600 text-white rounded-xl font-black transition-all active:scale-95 shadow-lg shadow-rose-200 ${deletePhrase !== 'borrar' || isDeleting ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-rose-700'}`}
                                >
                                    {isDeleting ? 'Borrando...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
