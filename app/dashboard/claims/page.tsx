"use client"

import { useEffect, useState } from "react"
import {
    ShieldAlert,
    Plus,
    Search,
    Filter,
    AlertTriangle,
    CheckCircle2,
    Clock,
    User,
    Phone,
    FileText,
    TrendingUp,
    ChevronRight,
    MessageSquare,
    Paperclip,
    Trash2,
    ExternalLink,
    ClipboardList,
    AlertCircle,
    Calendar,
    DollarSign,
    Zap,
    FileCheck,
    TowerControl,
    Copy,
    Mail,
    Percent,
    Sparkles
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { ClaimsAIWizard } from "@/components/dashboard/ClaimsAIWizard"
import { ClaimGapAnalysis } from "@/components/dashboard/ClaimGapAnalysis"

const STATUS_COLORS = {
    'Abierto': 'bg-blue-100 text-blue-700 border-blue-200',
    'En Proceso': 'bg-amber-100 text-amber-700 border-amber-200',
    'Cerrado': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Rechazado': 'bg-rose-100 text-rose-700 border-rose-200'
}

const REPORTING_DIRECTORY: Record<string, { portal?: string, email?: string, phone?: string }> = {
    'GNP': { portal: 'https://www.gnp.com.mx/soy-cliente', phone: '55 5227 9000', email: 'siniestros.gastosmedicos@gnp.com.mx' },
    'AXA': { portal: 'https://axa.mx/servicios-en-linea', phone: '01 800 900 1292' },
    'MetLife': { portal: 'https://mi.metlife.com.mx/', phone: '55 5328 7000' },
    'Monterrey NYL': { portal: 'https://smnyl-clientes.com.mx/', phone: '800 505 4000', email: 'clientes@mnyl.com.mx' },
    'Quálitas': { portal: 'https://www.qualitas.com.mx/portal_asegurados', phone: '800 800 2880' },
    'Mapfre': { portal: 'https://www.mapfre.com.mx/seguros-mx/personas/servicios-linea/', phone: '800 062 7373' },
    'Zurich': { portal: 'https://www.zurich.com.mx/es-mx/siniestros', phone: '800 288 6911' },
    'HDI': { portal: 'https://www.hdi.com.mx/reportar-siniestro/', phone: '800 019 6000' },
    'Chubb': { portal: 'https://www.chubb.com/mx-es/siniestros/', phone: '800 366 3835' },
    'Plan Seguro': { portal: 'https://asegurado.planseguro.com.mx:444/', phone: '800 277 1234' }
}

const formatWithCommas = (val: number | string) => {
    if (val === "" || val === 0 || val === "0") return "";
    const num = typeof val === 'string' ? Number(val.replace(/,/g, '')) : val;
    if (isNaN(num)) return "";
    return new Intl.NumberFormat('en-US').format(num);
};

const parseCommas = (str: string) => {
    return Number(str.replace(/,/g, '')) || 0;
};

export default function ClaimsPage() {
    const [claims, setClaims] = useState<any[]>([])
    const [policies, setPolicies] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [step, setStep] = useState(1)
    const [policiesLoading, setPoliciesLoading] = useState(false)
    const [policySearch, setPolicySearch] = useState("")

    // New Claim Form State
    const [selectedPolicy, setSelectedPolicy] = useState<any>(null)
    const [claimType, setClaimType] = useState("")
    const [description, setDescription] = useState("")
    const [folioNumber, setFolioNumber] = useState("")
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
    const [responseDate, setResponseDate] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [aiAnalysisData, setAiAnalysisData] = useState<any>(null)

    // Claims 360 Detail State
    const [viewingClaim, setViewingClaim] = useState<any>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    const [activeTab, setActiveTab] = useState<'checklist' | 'reporting'>('checklist')

    useEffect(() => {
        fetchClaims()
        fetchPolicies()
    }, [])

    const fetchClaims = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('claims')
                .select(`
                    *,
                    client:clients(first_name, last_name, phone),
                    policy:policies(id, policy_number, insurer:insurers(name))
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setClaims(data || [])
        } catch (error) {
            console.error('Error loading claims:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchPolicies = async () => {
        try {
            setPoliciesLoading(true)
            const { data, error } = await supabase
                .from('policies')
                .select('*, client:clients(first_name, last_name, phone), insurer:insurers(name)')
                .neq('status', 'Cancelada')

            if (error) throw error
            setPolicies(data || [])
        } catch (err) {
            console.error('Error fetching policies for claims:', err)
        } finally {
            setPoliciesLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!selectedPolicy || !claimType || !description) return

        try {
            setIsSubmitting(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Duplicate Detection
            if (folioNumber) {
                const { data: existing } = await supabase
                    .from('claims')
                    .select('id')
                    .eq('policy_id', selectedPolicy.id)
                    .eq('folio_number', folioNumber)
                    .maybeSingle()

                if (existing) {
                    if (!confirm(`Ya existe un siniestro con el folio ${folioNumber} para esta póliza. ¿Deseas crear un duplicado?`)) {
                        setIsSubmitting(false)
                        return
                    }
                }
            }

            const getChecklistForType = () => {
                if (claimType === 'Asistencia Médica') {
                    if (selectedPolicy?.insurer?.name?.toUpperCase().includes('PLAN SEGURO')) {
                        const basePlanSeguro = [
                            { name: 'Aviso de Accidente o Enfermedad (Plan Seguro)', status: 'pending', required: true },
                            { name: 'Identificación Oficial del Asegurado', status: 'pending', required: true },
                            { name: 'Facturas y Recetas Originales', status: 'pending', required: true }
                        ]
                        if (description.toLowerCase().includes('reembolso')) {
                            return [
                                ...basePlanSeguro,
                                { name: 'Solicitud de Reembolso', status: 'pending', required: true },
                                { name: 'Informe Médico Especialista', status: 'pending', required: true },
                                { name: 'Estado de Cuenta (CLABE)', status: 'pending', required: true }
                            ]
                        }
                        if (description.toLowerCase().includes('programación') || description.toLowerCase().includes('cirugía')) {
                            return [
                                { name: 'Solicitud de Programación de Cirugía', status: 'pending', required: true },
                                { name: 'Informe Médico Especialista', status: 'pending', required: true },
                                { name: 'Presupuesto Médico / Hospitalario', status: 'pending', required: true },
                                { name: 'Identificación Oficial del Asegurado', status: 'pending', required: true },
                                { name: 'Estudios Médicos Relacionados', status: 'pending', required: true }
                            ]
                        }
                        return basePlanSeguro;
                    }

                    if (description.toLowerCase().includes('reembolso')) {
                        return [
                            { name: 'Solicitud de Reclamación GMM', status: 'pending', required: true },
                            { name: 'Informe Médico Original', status: 'pending', required: true },
                            { name: 'Facturas XML/PDF (Hospital/Honorarios)', status: 'pending', required: true },
                            { name: 'Estado de Cuenta (CLABE)', status: 'pending', required: true },
                            { name: 'Identificación Oficial Vigente', status: 'pending', required: true },
                            { name: 'Recetas Médicas y Estudios', status: 'pending', required: true },
                            { name: 'Comprobante de Domicilio', status: 'pending', required: false }
                        ]
                    }
                    if (description.toLowerCase().includes('cirugía') || description.toLowerCase().includes('programación')) {
                        return [
                            { name: 'Solicitud de Programación GMM', status: 'pending', required: true },
                            { name: 'Informe Médico Tratante', status: 'pending', required: true },
                            { name: 'Presupuesto Quirúrgico Desglosado', status: 'pending', required: true },
                            { name: 'Interpretación de Estudios de Diagnóstico', status: 'pending', required: true },
                            { name: 'Identificación Oficial Vigente', status: 'pending', required: true },
                            { name: 'Credencial de Asegurado', status: 'pending', required: true }
                        ]
                    }
                }
                // Default checklist
                return [
                    { name: 'Informe Médico / Declaración', status: 'pending', required: true },
                    { name: 'Identificación Oficial', status: 'pending', required: true },
                    { name: 'Comprobante de Domicilio', status: 'pending', required: false }
                ]
            }

            const { data: newClaimData, error } = await (supabase.from('claims') as any).insert({
                policy_id: selectedPolicy.id,
                client_id: selectedPolicy.client_id,
                claim_type: claimType,
                folio_number: folioNumber,
                report_date: reportDate,
                insurer_response_date: responseDate || null,
                status: 'Abierto',
                description: description,
                estimated_amount: 0,
                deductible_amount: 0,
                co_insurance_percentage: 0,
                checklist: getChecklistForType()
            }).select().single()

            let savedClaim = newClaimData

            if (error) {
                console.error('Supabase Primary Insert Error:', error)
                // Fallback for missing columns (migration not run)
                const { data: fallbackData, error: fallbackError } = await (supabase.from('claims') as any).insert({
                    policy_id: selectedPolicy.id,
                    client_id: selectedPolicy.client_id,
                    claim_type: claimType,
                    folio_number: folioNumber,
                    report_date: reportDate,
                    status: 'Abierto',
                    description: description
                }).select().single()

                if (fallbackError) {
                    console.error('Supabase Fallback Insert Error:', fallbackError)
                    throw new Error(`Error: ${error.message} (Fallback: ${fallbackError.message})`)
                }
                savedClaim = fallbackData
            }

            setIsModalOpen(false)
            setStep(1)
            setSelectedPolicy(null)
            setClaimType("")
            setDescription("")
            setFolioNumber("")
            setResponseDate("")

            // Auto-open 360 Drawer for the new claim
            if (savedClaim) {
                setViewingClaim(savedClaim)
                setIsDrawerOpen(true)
            }

            fetchClaims()
        } catch (error: any) {
            console.error('Error reporting claim:', error)
            alert(`Error al reportar: ${error.message || 'Error desconocido'}. Revisa que hayas ejecutado las migraciones en Supabase.`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const toggleChecklistItem = async (claimId: string, itemName: string) => {
        const claim = viewingClaim?.id === claimId ? viewingClaim : claims.find(c => c.id === claimId)
        if (!claim) return

        const newChecklist = (claim.checklist || []).map((item: any) =>
            item.name === itemName
                ? { ...item, status: item.status === 'received' ? 'pending' : 'received' }
                : item
        )

        setIsUpdatingStatus(true)
        try {
            const { error } = await (supabase.from('claims') as any)
                .update({ checklist: newChecklist } as any)
                .eq('id', claimId)

            if (error) throw error
            if (viewingClaim?.id === claimId) setViewingClaim({ ...viewingClaim, checklist: newChecklist })
            fetchClaims()
        } catch (error) {
            console.error('Error updating checklist:', error)
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    const addCustomChecklistItem = async (claimId: string, name: string) => {
        if (!name.trim()) return
        const claim = viewingClaim?.id === claimId ? viewingClaim : claims.find(c => c.id === claimId)
        if (!claim) return

        const newChecklist = [...(claim.checklist || []), { name, status: 'pending', required: false }]

        setIsUpdatingStatus(true)
        try {
            const { error } = await (supabase.from('claims') as any)
                .update({ checklist: newChecklist } as any)
                .eq('id', claimId)

            if (error) throw error
            if (viewingClaim?.id === claimId) setViewingClaim({ ...viewingClaim, checklist: newChecklist })
            fetchClaims()
        } catch (error) {
            console.error('Error adding custom requirement:', error)
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    const handleDeleteClaim = async (claimId: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este siniestro? Esta acción no se puede deshacer.')) return

        setIsUpdatingStatus(true)
        try {
            const { error } = await supabase.from('claims').delete().eq('id', claimId)
            if (error) throw error
            setIsDrawerOpen(false)
            setViewingClaim(null)
            fetchClaims()
        } catch (error) {
            console.error('Error deleting claim:', error)
            alert('Error al eliminar el siniestro.')
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    const updateFinancials = async (claimId: string, field: string, value: any) => {
        const claim = viewingClaim?.id === claimId ? viewingClaim : claims.find(c => c.id === claimId)
        if (!claim) return

        setIsUpdatingStatus(true)
        try {
            const { error } = await (supabase.from('claims') as any)
                .update({ [field]: value } as any)
                .eq('id', claimId)

            if (error) throw error
            if (viewingClaim?.id === claimId) setViewingClaim({ ...viewingClaim, [field]: value })
            fetchClaims()
        } catch (error) {
            console.error('Error updating financials:', error)
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    const handleFileUpload = async (claimId: string, itemName: string, file: File) => {
        if (!file) return

        // 5MB Size Limit Check
        const MAX_SIZE = 5 * 1024 * 1024 // 5MB
        if (file.size > MAX_SIZE) {
            alert(`El archivo es demasiado grande. El límite es de 5MB. (Tu archivo: ${(file.size / (1024 * 1024)).toFixed(2)}MB)`)
            return
        }

        setIsUpdatingStatus(true)
        try {
            const fileExt = file.name.split('.').pop()
            const filePath = `claims/${claimId}/${itemName}-${Math.random().toString(36).substring(7)}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('claim_docs')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('claim_docs')
                .getPublicUrl(filePath)

            const currentChecklist = viewingClaim?.id === claimId ? viewingClaim.checklist : claims.find(c => c.id === claimId)?.checklist
            const newChecklist = (currentChecklist || []).map((item: any) =>
                item.name === itemName
                    ? { ...item, status: 'received', document_url: publicUrl }
                    : item
            )

            const { error: updateError } = await (supabase.from('claims') as any)
                .update({ checklist: newChecklist } as any)
                .eq('id', claimId)

            if (updateError) throw updateError
            if (viewingClaim?.id === claimId) setViewingClaim({ ...viewingClaim, checklist: newChecklist })
            fetchClaims()
        } catch (error) {
            console.error('Error uploading file:', error)
            alert('Error al cargar archivo. Asegúrate de tener el bucket claim_docs creado.')
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    const handleAIAnalysisComplete = (data: any) => {
        setAiAnalysisData(data)
        if (data.diagnosis) {
            setDescription(prev => {
                const clean = prev.replace(/\[DIA:.*\]/, "").trim()
                return `[DIA: ${data.diagnosis}] ${clean}`
            })
        }
        if (data.folio) setFolioNumber(data.folio)
        if (data.claim_date) setReportDate(data.claim_date)
    }

    const filteredPolicies = policies.filter(p =>
        (p.client?.first_name + " " + p.client?.last_name).toLowerCase().includes(policySearch.toLowerCase()) ||
        (p.policy_number || "").toLowerCase().includes(policySearch.toLowerCase())
    )

    const filtered = claims.filter(c =>
        (c.client?.first_name + " " + c.client?.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.policy?.policy_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <ShieldAlert className="w-8 h-8 text-rose-600" /> Gestión de Siniestros
                    </h1>
                    <p className="text-slate-500 mt-1">Monitorea y resuelve los incidentes de tus clientes.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-rose-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-rose-200 hover:bg-rose-700 active:scale-95 transition-all w-fit"
                >
                    <Plus className="w-5 h-5" /> Reportar Nuevo Siniestro
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Activos', value: claims.filter(c => c.status !== 'Cerrado').length, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
                    { label: 'En Proceso', value: claims.filter(c => c.status === 'En Proceso').length, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
                    { label: 'Cerrados Mes', value: claims.filter(c => c.status === 'Cerrado').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
                    { label: 'Importe Estimado', value: `$${claims.reduce((acc, c) => acc + (c.estimated_amount || 0), 0).toLocaleString()}`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-100' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className={cn("p-3 rounded-2xl", stat.bg, stat.color)}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-xl font-black text-slate-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por cliente, póliza o descripción del siniestro..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Claims Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnimatePresence>
                    {loading ? (
                        Array(4).fill(0).map((_, i) => (
                            <div key={i} className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
                        ))
                    ) : filtered.length === 0 ? (
                        <div className="col-span-full py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                <ShieldAlert className="w-10 h-10" />
                            </div>
                            <p className="text-slate-500 font-medium italic">No se encontraron siniestros registrados.</p>
                        </div>
                    ) : (
                        filtered.map((claim) => (
                            <motion.div
                                layout
                                key={claim.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group cursor-pointer active:scale-[0.98]"
                                onClick={() => {
                                    setViewingClaim(claim)
                                    setIsDrawerOpen(true)
                                }}
                            >
                                <div className="p-6 space-y-5">
                                    {/* Card Top: Status & ID */}
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase border", STATUS_COLORS[claim.status as keyof typeof STATUS_COLORS])}>
                                                    {claim.status}
                                                </span>
                                                {claim.folio_number && (
                                                    <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-tighter">
                                                        FOLIO: {claim.folio_number}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900 group-hover:text-rose-600 transition-colors capitalize pt-1">
                                                {claim.client?.first_name} {claim.client?.last_name}
                                            </h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tipo / Ramo</p>
                                            <p className="text-xs font-bold text-slate-700 uppercase italic">{claim.claim_type || 'General'}</p>
                                        </div>
                                    </div>

                                    {/* Card Mid: Tracking Dates */}
                                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="space-y-0.5">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Fecha Reporte</p>
                                            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                <Clock className="w-3 h-3 text-rose-500" />
                                                {claim.report_date ? new Date(claim.report_date).toLocaleDateString() : 'Pendiente'}
                                            </p>
                                        </div>
                                        <div className="space-y-0.5 text-right border-l border-slate-200 pl-3">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Próx. Seguimiento</p>
                                            <p className="text-xs font-bold text-slate-700 flex items-center justify-end gap-1.5">
                                                {claim.insurer_response_date ? new Date(claim.insurer_response_date).toLocaleDateString() : 'Por Definir'}
                                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                                            </p>
                                        </div>
                                    </div>

                                    {/* Card Bottom: Description & Document Progress */}
                                    <div className="space-y-3">
                                        <div className="p-4 bg-white rounded-2xl border border-slate-100 italic text-sm text-slate-500 leading-relaxed shadow-inner">
                                            "{claim.description || 'Sin descripción detallada...'}"
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progreso Documentación</p>
                                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                                                    {(claim.checklist || []).filter((i: any) => i.status === 'received').length} / {(claim.checklist || []).length}
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${((claim.checklist || []).filter((i: any) => i.status === 'received').length / Math.max((claim.checklist || []).length, 1)) * 100}%` }}
                                                    className="h-full bg-rose-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Policy Info */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                <FileText className="w-3.5 h-3.5" />
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-500">{claim.policy?.policy_number} • {claim.policy?.insurer?.name}</p>
                                        </div>
                                        <div className="text-[10px] font-black text-rose-600 uppercase tracking-widest">
                                            Gestionar 360 →
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
            {/* Claims 360 Drawer */}
            <AnimatePresence>
                {isDrawerOpen && viewingClaim && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDrawerOpen(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-full max-w-4xl bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.15)] z-[70] overflow-y-auto"
                        >
                            <div className="p-12 space-y-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase border mb-2 inline-block", STATUS_COLORS[viewingClaim.status as keyof typeof STATUS_COLORS])}>
                                            {viewingClaim.status}
                                        </span>
                                        <h2 className="text-2xl font-black text-slate-900 leading-tight">
                                            Gestión de Siniestro<br />
                                            <span className="text-rose-600">{viewingClaim.folio_number || 'S/F'}</span>
                                        </h2>
                                        {viewingClaim.claim_type === 'Asistencia Médica' && (
                                            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
                                                <TrendingUp className="w-3 h-3" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {viewingClaim.description?.toLowerCase().includes('reembolso') ? 'TRÁMITE: REEMBOLSO' :
                                                        viewingClaim.description?.toLowerCase().includes('programación') ? 'TRÁMITE: PROGRAMACIÓN' :
                                                            viewingClaim.description?.toLowerCase().includes('accidente') ? 'TRÁMITE: ACCIDENTE' : 'GASTOS MÉDICOS'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => setIsDrawerOpen(false)} className="p-3 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 transition-all">
                                        <Plus className="w-6 h-6 rotate-45" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Action Tags */}
                                    <div className="flex flex-wrap gap-2">
                                        <button className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-2 hover:bg-blue-100 transition-all">
                                            <MessageSquare className="w-3 h-3" /> WhatsApp Cliente
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClaim(viewingClaim.id)}
                                            className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 flex items-center gap-2 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all ml-auto"
                                        >
                                            <Trash2 className="w-3 h-3" /> Eliminar
                                        </button>
                                    </div>

                                    {/* Tab Switcher - Premium Design */}
                                    <div className="flex p-1.5 bg-slate-100 rounded-3xl mb-8 border border-slate-200">
                                        <button
                                            onClick={() => setActiveTab('checklist')}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all",
                                                activeTab === 'checklist'
                                                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5 pulse-subtle"
                                                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                                            )}
                                        >
                                            <FileCheck className="w-4 h-4" />
                                            Gestión y Docs
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('reporting')}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all relative",
                                                activeTab === 'reporting'
                                                    ? "bg-rose-600 text-white shadow-lg shadow-rose-200"
                                                    : "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                            )}
                                        >
                                            <Zap className="w-4 h-4" />
                                            Reportar Siniestro
                                            {(viewingClaim.checklist || []).filter((i: any) => i.document_url).length >= 2 && (
                                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                                            )}
                                        </button>
                                    </div>

                                    {activeTab === 'checklist' ? (
                                        <div className="space-y-8">
                                            {/* Financials & Dates */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-slate-50 rounded-[40px] border border-slate-100">
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Coaseguro (%)</p>
                                                        <div className="relative group">
                                                            <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-500" />
                                                            <input
                                                                type="text"
                                                                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-2xl font-black text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none transition-all shadow-sm"
                                                                value={viewingClaim.co_insurance_percentage === 0 ? "" : viewingClaim.co_insurance_percentage || ""}
                                                                onChange={(e) => updateFinancials(viewingClaim.id, 'co_insurance_percentage', e.target.value.replace(/[^0-9.]/g, ''))}
                                                                placeholder="Ej. 10"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 bg-white/50 p-3 rounded-xl">
                                                        <Clock className="w-4 h-4 text-rose-500" />
                                                        Reportado el: {viewingClaim.report_date ? new Date(viewingClaim.report_date).toLocaleDateString() : 'Pendiente'}
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Deducible Pactado</p>
                                                        <div className="relative group">
                                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                            <input
                                                                type="text"
                                                                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-2xl font-black text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none transition-all shadow-sm"
                                                                value={formatWithCommas(viewingClaim.deductible_amount || 0)}
                                                                onChange={(e) => updateFinancials(viewingClaim.id, 'deductible_amount', parseCommas(e.target.value))}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 bg-white/50 p-3 rounded-xl border border-slate-100">
                                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                                        Estatus Proceso: <span className="text-rose-600 font-black uppercase">{viewingClaim.status}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Deep AI Audit Section - Gap Analysis */}
                                            <ClaimGapAnalysis claim={viewingClaim} />

                                            {/* Checklist Section */}
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between px-2">
                                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <ClipboardList className="w-4 h-4" /> Requisitos de Documentación
                                                    </h3>
                                                    <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-tighter border border-rose-100">
                                                        {(viewingClaim.checklist || []).filter((i: any) => i.status === 'received').length} / {(viewingClaim.checklist || []).length} Completados
                                                    </span>
                                                </div>

                                                <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
                                                    {(viewingClaim.checklist || []).length === 0 ? (
                                                        <div className="p-12 text-center text-slate-400 space-y-4">
                                                            <FileText className="w-12 h-12 mx-auto opacity-20" />
                                                            <p className="text-sm font-medium italic">No se han definido requisitos para este tipo de siniestro.</p>
                                                        </div>
                                                    ) : (
                                                        (viewingClaim.checklist || []).map((item: any, i: number) => (
                                                            <div key={i} className="group p-6 hover:bg-slate-50/50 transition-all flex items-center justify-between gap-6">
                                                                <div className="flex items-center gap-4">
                                                                    <button
                                                                        onClick={() => toggleChecklistItem(viewingClaim.id, item.name)}
                                                                        className={cn(
                                                                            "w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all",
                                                                            item.status === 'received'
                                                                                ? "bg-emerald-500 border-emerald-500 text-white"
                                                                                : "bg-white border-slate-200 text-transparent group-hover:border-rose-400"
                                                                        )}
                                                                    >
                                                                        <CheckCircle2 className="w-4 h-4" />
                                                                    </button>
                                                                    <div>
                                                                        <p className={cn("text-sm font-bold transition-all", item.status === 'received' ? "text-slate-400 line-through" : "text-slate-700")}>
                                                                            {item.name}
                                                                        </p>
                                                                        {item.required && (
                                                                            <span className="text-[8px] font-black uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">Obligatorio</span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-3">
                                                                    {item.document_url ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <a
                                                                                href={item.document_url}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all border border-rose-100"
                                                                                title="Ver documento"
                                                                            >
                                                                                <ExternalLink className="w-4 h-4" />
                                                                            </a>
                                                                            {item.document_url && (
                                                                                <button
                                                                                    onClick={() => alert(`Iniciando Revisión IA para: ${item.name}`)}
                                                                                    className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100"
                                                                                    title="Revisión IA"
                                                                                >
                                                                                    <Sparkles className="w-4 h-4" />
                                                                                </button>
                                                                            )}
                                                                            <label className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all border border-slate-200 cursor-pointer shadow-sm">
                                                                                <Paperclip className="w-4 h-4" />
                                                                                <input
                                                                                    type="file"
                                                                                    className="hidden"
                                                                                    onChange={(e) => e.target.files?.[0] && handleFileUpload(viewingClaim.id, item.name, e.target.files[0])}
                                                                                />
                                                                            </label>
                                                                        </div>
                                                                    ) : (
                                                                        <label className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all cursor-pointer shadow-lg shadow-slate-200 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                                                            <Paperclip className="w-4 h-4" /> Adjuntar
                                                                            <input
                                                                                type="file"
                                                                                className="hidden"
                                                                                onChange={(e) => e.target.files?.[0] && handleFileUpload(viewingClaim.id, item.name, e.target.files[0])}
                                                                            />
                                                                        </label>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>

                                                <div className="flex gap-3">
                                                    <input
                                                        type="text"
                                                        id="new-requirement"
                                                        placeholder="Agregar requisito personalizado..."
                                                        className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                addCustomChecklistItem(viewingClaim.id, e.currentTarget.value)
                                                                e.currentTarget.value = ""
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const input = document.getElementById('new-requirement') as HTMLInputElement
                                                            addCustomChecklistItem(viewingClaim.id, input.value)
                                                            input.value = ""
                                                        }}
                                                        className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {(() => {
                                                const insurerName = viewingClaim.policy?.insurer?.name || "";
                                                const guide = Object.entries(REPORTING_DIRECTORY).find(([key]) => insurerName.toUpperCase().includes(key.toUpperCase()))?.[1];

                                                if (!guide) return (
                                                    <div className="text-center p-12 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                                                        <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                                        <p className="text-sm font-bold text-slate-500">No hay guía de reporte específica para {insurerName}</p>
                                                        <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-black">Contacta soporte para añadirla</p>
                                                    </div>
                                                );

                                                return (
                                                    <div className="space-y-6">
                                                        <div className="p-8 bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-100 rounded-[32px] space-y-6 shadow-sm border-b-4 border-b-rose-200/50">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md border border-rose-100 relative">
                                                                        <TowerControl className="w-7 h-7 text-rose-500" />
                                                                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center border-2 border-white">
                                                                            <span className="animate-ping absolute w-full h-full bg-rose-400 rounded-full opacity-50" />
                                                                            <Zap className="w-2.5 h-2.5 text-white" />
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-600/60 leading-none mb-1">Fase de Acción en Vivo</p>
                                                                        <p className="text-lg font-black text-rose-950">{insurerName}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4">
                                                                {guide.phone && (
                                                                    <div className="p-5 bg-white/80 border border-rose-100 rounded-2xl flex items-center justify-between group/phone">
                                                                        <div>
                                                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Teléfono de Cabina</p>
                                                                            <p className="text-xl font-black text-rose-600 tracking-tighter tabular-nums selection:bg-rose-100">{guide.phone}</p>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => {
                                                                                navigator.clipboard.writeText(guide.phone || "");
                                                                            }}
                                                                            className="p-3 bg-white text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100"
                                                                            title="Copiar número"
                                                                        >
                                                                            <Copy className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                <div className="grid grid-cols-2 gap-3">
                                                                    {guide.portal && (
                                                                        <a
                                                                            href={guide.portal}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                                                                        >
                                                                            <ExternalLink className="w-5 h-5 opacity-60" />
                                                                            <span className="text-[9px] font-black uppercase tracking-widest">Portal Web</span>
                                                                        </a>
                                                                    )}
                                                                    {guide.email && (
                                                                        <a
                                                                            href={`mailto:${guide.email}`}
                                                                            className="p-4 bg-white border border-rose-200 text-rose-600 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-rose-50 transition-all font-black text-[9px] uppercase tracking-widest"
                                                                        >
                                                                            <Mail className="w-5 h-5" />
                                                                            Enviar Correo
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Quick Access to Documents */}
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between px-2">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documentos Listos para Reporte</p>
                                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                                    {(viewingClaim.checklist || []).filter((i: any) => i.document_url).length} Archivos
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-1 gap-2">
                                                                {(viewingClaim.checklist || []).filter((i: any) => i.document_url).map((doc: any, idx: number) => (
                                                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-rose-500 shadow-sm">
                                                                                <FileText className="w-4 h-4" />
                                                                            </div>
                                                                            <p className="text-[11px] font-bold text-slate-700 truncate max-w-[200px]">{doc.name}</p>
                                                                        </div>
                                                                        <a
                                                                            href={doc.document_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                                        >
                                                                            <ExternalLink className="w-4 h-4" />
                                                                        </a>
                                                                    </div>
                                                                ))}
                                                                {(viewingClaim.checklist || []).filter((i: any) => i.document_url).length === 0 && (
                                                                    <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Sin documentos adjuntos aún</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* New Claim Modal */}
            <AnimatePresence>
                {
                    isModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsModalOpen(false)}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
                            >
                                {/* Modal Header */}
                                <div className="bg-rose-600 p-8 text-white relative">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <ShieldAlert className="w-32 h-32" />
                                    </div>
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="bg-white/20 p-2 rounded-xl">
                                            <Plus className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-2xl font-black uppercase tracking-tight">Reportar Siniestro</h2>
                                    </div>
                                    <p className="text-rose-100 font-medium">Sigue los pasos para iniciar el reporte oficial.</p>

                                    {/* Steps Indicator */}
                                    <div className="flex gap-2 mt-6">
                                        {[1, 2, 3].map(s => (
                                            <div key={s} className={cn(
                                                "h-1.5 rounded-full transition-all duration-300",
                                                step >= s ? "w-8 bg-white" : "w-4 bg-white/30"
                                            )} />
                                        ))}
                                    </div>
                                </div>

                                <div className="p-8">
                                    {step === 1 && (
                                        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">1. Selecciona la Póliza Afectada</label>

                                                {/* Buscador de Pólitcas In-Modal */}
                                                <div className="relative mb-4">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Buscar por cliente o número de póliza..."
                                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                                        value={policySearch}
                                                        onChange={(e) => setPolicySearch(e.target.value)}
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {policiesLoading ? (
                                                        <div className="py-12 text-center text-slate-400 space-y-3">
                                                            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                                            <p className="text-[10px] font-bold uppercase tracking-widest">Cargando pólizas...</p>
                                                        </div>
                                                    ) : filteredPolicies.length === 0 ? (
                                                        <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                                                            <p className="text-[10px] font-bold uppercase tracking-widest">No se encontraron pólizas vigentes</p>
                                                        </div>
                                                    ) : (
                                                        filteredPolicies.map(p => (
                                                            <button
                                                                key={p.id}
                                                                onClick={() => {
                                                                    setSelectedPolicy(p)
                                                                    setStep(2)
                                                                    setPolicySearch("") // Reset search
                                                                }}
                                                                className={cn(
                                                                    "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                                                                    selectedPolicy?.id === p.id
                                                                        ? "bg-rose-50 border-rose-200 ring-2 ring-rose-500/20"
                                                                        : "bg-white border-slate-100 hover:border-slate-300"
                                                                )}
                                                            >
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-900">{p.client?.first_name} {p.client?.last_name}</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{p.insurer?.name} • {p.policy_number}</p>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 italic">
                                                                        {p.status || 'Vigente'}
                                                                    </span>
                                                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                                                </div>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 2 && (
                                        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">2. Tipo de Siniestro / Endoso</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        { id: 'Colisión/Accidente', label: 'Accidente Vial', icon: AlertTriangle },
                                                        { id: 'Robo Total', label: 'Robo Total', icon: ShieldAlert },
                                                        { id: 'Cristales', label: 'Cristales', icon: FileText },
                                                        { id: 'Asistencia Médica', label: 'Médico / GMM', icon: Plus },
                                                        { id: 'Hogar / Daños', label: 'Daños Hogar', icon: ShieldAlert },
                                                        { id: 'Otro / Endoso', label: 'Otro / Trámite', icon: FileText }
                                                    ].map(type => (
                                                        <button
                                                            key={type.id}
                                                            onClick={() => {
                                                                setClaimType(type.id)
                                                                setStep(3)
                                                            }}
                                                            className={cn(
                                                                "flex flex-col items-center justify-center p-6 rounded-[32px] border transition-all gap-2",
                                                                claimType === type.id
                                                                    ? "bg-rose-600 border-rose-600 text-white shadow-xl shadow-rose-200 scale-[1.02]"
                                                                    : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-slate-300"
                                                            )}
                                                        >
                                                            <type.icon className={cn("w-6 h-6", claimType === type.id ? "text-rose-100" : "text-slate-400")} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-center">{type.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => setStep(1)}
                                                    className="mt-6 text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"
                                                >
                                                    ← Volver a selección de póliza
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 3 && (
                                        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
                                            {/* AI Wizard for Auto-Fill */}
                                            <ClaimsAIWizard onAnalysisComplete={handleAIAnalysisComplete} claimType={claimType} />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Folio Aseguradora</label>
                                                    <input
                                                        type="text"
                                                        value={folioNumber}
                                                        onChange={(e) => setFolioNumber(e.target.value)}
                                                        placeholder="Ej. SIN-123456"
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Fecha Reporte</label>
                                                    <input
                                                        type="date"
                                                        value={reportDate}
                                                        onChange={(e) => setReportDate(e.target.value)}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                                    />
                                                </div>
                                                <div className="col-span-full space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Próximo Seguimiento (Respuesta Tentativa)</label>
                                                    <input
                                                        type="date"
                                                        value={responseDate}
                                                        onChange={(e) => setResponseDate(e.target.value)}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                                    />
                                                    <p className="text-[9px] text-slate-400 italic">El sistema te avisará cuando se cumpla esta fecha.</p>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">3. Descripción del Evento</label>

                                                {/* Smart Questions for GMM */}
                                                {claimType === 'Asistencia Médica' && (
                                                    <div className="space-y-4 mb-4">
                                                        <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">¿Qué tipo de trámite es? (Selecciona para autocompletar requisitos)</label>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {[
                                                                { id: 'Accidente', label: 'Accidente', icon: AlertTriangle },
                                                                { id: 'Programación', label: 'Programación', icon: Clock },
                                                                { id: 'Reembolso', label: 'Reembolso', icon: TrendingUp }
                                                            ].map((sub) => (
                                                                <button
                                                                    key={sub.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const cleanDesc = description.replace(/\[.*\]\s*/, "")
                                                                        setDescription(`[${sub.id}] ${cleanDesc}`)
                                                                    }}
                                                                    className={cn(
                                                                        "flex flex-col items-center p-3 rounded-2xl border transition-all gap-1.5",
                                                                        description.includes(`[${sub.id}]`)
                                                                            ? "bg-rose-50 border-rose-200 text-rose-600 scale-105 shadow-sm"
                                                                            : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                                                                    )}
                                                                >
                                                                    <sub.icon className="w-4 h-4" />
                                                                    <span className="text-[9px] font-black uppercase">{sub.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <textarea
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    className="w-full h-32 p-6 bg-slate-50 border border-slate-100 rounded-[32px] text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-rose-500 transition-all resize-none"
                                                    placeholder="Describe brevemente lo sucedido o el trámite requerido..."
                                                />
                                            </div>
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => setStep(2)}
                                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                                                >
                                                    Anterior
                                                </button>
                                                <button
                                                    onClick={handleSubmit}
                                                    disabled={isSubmitting || !description}
                                                    className="flex-[2] py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 disabled:opacity-50"
                                                >
                                                    {isSubmitting ? 'Procesando...' : 'Confirmar Registro Integral'}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence>
        </div>
    )
}
