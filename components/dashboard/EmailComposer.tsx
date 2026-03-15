"use client"

import { useState, useEffect, useRef } from "react"
import { X, Send, Paperclip, FileText, Sparkles, Shield, ChevronDown, CheckCircle2, Loader2, Mail, ExternalLink, AlertCircle, Eye, Edit3, Settings, UserCheck, Users, Search, PlusCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { CommunicationService, EmailCategory } from "@/lib/communications"
import { supabase } from "@/lib/supabase"
import { PushService } from "@/lib/push-notifications"
import Link from "next/link"

interface EmailComposerProps {
    isOpen: boolean
    onClose: () => void
    client: {
        id: string
        first_name: string
        last_name: string
        email: string
        secondary_email?: string
        additional_emails?: any[]
        related_contacts?: any[]
    }
    initialCategory?: EmailCategory
    policyData?: any
    documents?: any[]
    preSelectedDocId?: string
}

export default function EmailComposer({ 
    isOpen, 
    onClose, 
    client, 
    initialCategory = 'manual', 
    policyData,
    documents = [],
    preSelectedDocId
}: EmailComposerProps) {
    const [category, setCategory] = useState<EmailCategory>(initialCategory)
    const [subject, setSubject] = useState("")
    const [body, setBody] = useState("") 
    const [customMessage, setCustomMessage] = useState("") 
    const [toEmail, setToEmail] = useState(client.email)
    const [ccEmail, setCcEmail] = useState("")
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)
    const [selectedDocs, setSelectedDocs] = useState<string[]>([])
    const [showPreview, setShowPreview] = useState(true)
    const [hasSmtpConfig, setHasSmtpConfig] = useState<boolean | null>(null)
    const [showContactPicker, setShowContactPicker] = useState(false)
    const [selectedVideoUrl, setSelectedVideoUrl] = useState("")
    const [videoProposals, setVideoProposals] = useState<any[]>([])
    const pickerRef = useRef<HTMLDivElement>(null)

    // Check SMTP Config
    useEffect(() => {
        if (isOpen) {
            checkSmtpConfig()
        }
    }, [isOpen])

    const checkSmtpConfig = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: config } = await supabase
            .from('communication_configs')
            .select('*')
            .eq('agent_id', user.id)
            .single()

        setHasSmtpConfig(!!config?.host && !!config?.username)
    }

    useEffect(() => {
        if (preSelectedDocId) {
            setSelectedDocs([preSelectedDocId])
        } else if (documents.length > 0 && category === 'new_policy') {
            setSelectedDocs([documents[0].id])
        }
        
        // Fetch Video Proposals if policyData exists
        if (isOpen && policyData?.id) {
            fetchVideoProposals()
        }
    }, [isOpen, preSelectedDocId, policyData?.id])

    const fetchVideoProposals = async () => {
        const { data } = await supabase
            .from('policy_documents')
            .select('*')
            .eq('policy_id', policyData.id)
            .ilike('document_type', '%video%')
        
        if (data) setVideoProposals(data)
    }

    useEffect(() => {
        if (isOpen) {
            applyTemplate(category)
        }
    }, [isOpen, category, customMessage])

    // Close picker when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowContactPicker(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const applyTemplate = (cat: EmailCategory) => {
        // v2.9.5: Get the first selected document URL if available for the button
        const firstDoc = documents.find(d => selectedDocs.includes(d.id));
        const portalUrl = firstDoc ? firstDoc.file_url : '#';

        const data = {
            clientName: `${client.first_name} ${client.last_name}`,
            policyNumber: policyData?.policy_number || 'PENDIENTE',
            insurer: policyData?.insurers?.alias || policyData?.insurers?.name || 'Compañía',
            branch: policyData?.insurance_lines?.name || 'Seguro',
            startDate: policyData?.start_date ? new Date(policyData.start_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
            expiryDate: policyData?.end_date ? new Date(policyData.end_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : 'PRÓXIMA',
            customMessage: customMessage || (cat === 'manual' ? '(Escribe tu mensaje aquí)' : ''),
            portalUrl: portalUrl,
            installments: policyData?.policy_installments || [],
            totalPremium: policyData?.total_premium ? policyData.total_premium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00',
            videoUrl: selectedVideoUrl
        }
        
        const content = CommunicationService.generateTemplate(cat, data)
        const subjects: Record<string, string> = {
            new_policy: `Tu nueva póliza de ${data.insurer} - ${data.policyNumber}`,
            renewal: `Aviso de Renovación: Tu póliza vence pronto`,
            pre_renewal: `Próximo Vencimiento: ${data.policyNumber} (${data.insurer})`,
            overdue: `IMPORTANTE: Pago Atrasado / Póliza Vencida - ${data.policyNumber}`,
            birthday: `¡Feliz Cumpleaños ${client.first_name}! 🎂`,
            manual: `Seguimiento de tu protección patrimonial`
        }

        setSubject(subjects[cat] || subjects.manual)
        setBody(content)
    }

    const getAllEmails = () => {
        const emails: { name: string, value: string, type: string }[] = []
        if (client.email) emails.push({ name: `${client.first_name} (Principal)`, value: client.email, type: 'Primario' })
        if (client.secondary_email) emails.push({ name: `${client.first_name} (Alternativo)`, value: client.secondary_email, type: 'Secundario' })
        
        const additional = (client.additional_emails as any[]) || []
        additional.forEach(ae => {
            if (ae.email) emails.push({ name: ae.name || 'Correo Adicional', value: ae.email, type: 'Persistente' })
        })

        const related = (client.related_contacts as any[]) || []
        related.forEach(c => {
            if (c.email) emails.push({ name: c.name, value: c.email, type: c.relation || 'Relacionado' })
        })

        return emails
    }

    const handleSend = async (testMode = false) => {
        setSending(true)
        try {
            // v2.9.5: Catch the real sender email for Test Mode
            const { data: { user } } = await supabase.auth.getUser()
            const { data: config } = await supabase
                .from('communication_configs')
                .select('from_email, username')
                .eq('agent_id', user?.id)
                .single()

            const testRecipient = config?.from_email || config?.username || toEmail;

            const selectedAttachments = documents
                .filter(doc => selectedDocs.includes(doc.id))
                .map(doc => ({
                    filename: `${doc.document_type} - ${doc.name || 'documento'}.pdf`,
                    path: doc.file_url 
                }))

            await CommunicationService.sendEmail({
                to: testMode ? testRecipient : toEmail, 
                cc: testMode ? "" : ccEmail,
                subject: testMode ? `[PRUEBA] ${subject}` : subject,
                body: body,
                clientId: client.id,
                category,
                attachments: selectedAttachments as any,
                customMessage: customMessage
            })

            await PushService.notify(
                "¡Correo Enviado! 📧",
                `Tu mensaje para ${client.first_name} ha sido procesado con éxito.`,
                `/dashboard/policies`
            )
            
            setSent(true)
            setTimeout(() => {
                onClose()
                setSent(false)
            }, 2000)
        } catch (error) {
            alert("Error al enviar el correo. Por favor verifica tu configuración de SMTP.")
        } finally {
            setSending(false)
        }
    }

    if (!isOpen) return null

    const availableEmails = getAllEmails()

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[90vh]"
                >
                    {/* Header: Outlook Style */}
                    <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase italic">Smart Composer <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-lg ml-2 not-italic shadow-sm shadow-indigo-100 animate-pulse">v2.9.12 [OMNI]</span></h2>
                                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3 text-indigo-500 fill-indigo-500" /> Motor Corporativo v2 Activo
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setShowPreview(!showPreview)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                    ${showPreview ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-500 border border-transparent'}`}
                            >
                                {showPreview ? <><Edit3 className="w-3 h-3" /> Ver Editor</> : <><Eye className="w-3 h-3" /> Ver Vista Previa</>}
                            </button>
                            <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-2xl transition-all">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* SMTP Warning Banner */}
                    {hasSmtpConfig === false && (
                        <div className="bg-amber-50 border-b border-amber-100 px-8 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
                                    <AlertCircle className="w-4 h-4" />
                                </div>
                                <p className="text-[11px] font-bold text-amber-800">Tu correo no está configurado. El envío fallará.</p>
                            </div>
                            <Link 
                                href="/dashboard/settings/emails" 
                                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all flex items-center gap-2"
                            >
                                <Settings className="w-3 h-3" /> Configurar Ahora
                            </Link>
                        </div>
                    )}

                    {/* Main Content Area */}
                    <div className="flex-1 flex overflow-hidden bg-slate-50/50">
                        {/* Left Column: Form */}
                        <div className={`flex flex-col p-8 transition-all duration-500 ${showPreview ? 'w-[450px] border-r border-slate-100 bg-white' : 'flex-1'}`}>
                            <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2">
                                {/* Recipients Section */}
                                <div className="space-y-4">
                                    <div className="space-y-1.5 relative">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                                            <span>Destinatario (Para)</span>
                                            <button 
                                                onClick={() => setShowContactPicker(!showContactPicker)}
                                                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                                            >
                                                <Users className="w-3 h-3" /> Seleccionar Contacto
                                            </button>
                                        </label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="email"
                                                value={toEmail}
                                                onChange={(e) => setToEmail(e.target.value)}
                                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                                                placeholder="correo@ejemplo.com"
                                            />
                                        </div>

                                        {/* Contact Picker Dropdown */}
                                        <AnimatePresence>
                                            {showContactPicker && (
                                                <motion.div 
                                                    ref={pickerRef}
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute z-[110] left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
                                                >
                                                    <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                                                        <Search className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="text-[9px] font-black text-slate-400 uppercase">Contactos Disponibles</span>
                                                    </div>
                                                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                                                        {availableEmails.map((email, i) => (
                                                            <button 
                                                                key={i}
                                                                onClick={() => {
                                                                    setToEmail(email.value)
                                                                    setShowContactPicker(false)
                                                                }}
                                                                className="w-full p-4 flex items-center justify-between border-b border-slate-50 hover:bg-indigo-50 transition-all group text-left"
                                                            >
                                                                <div>
                                                                    <p className="text-[11px] font-black text-slate-800 group-hover:text-indigo-700">{email.name}</p>
                                                                    <p className="text-[9px] text-slate-400 lowercase">{email.value}</p>
                                                                </div>
                                                                <span className="text-[8px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-bold uppercase tracking-tighter truncate max-w-[80px]">
                                                                    {email.type}
                                                                </span>
                                                            </button>
                                                        ))}
                                                        {availableEmails.length === 0 && (
                                                            <div className="p-8 text-center text-slate-400 italic text-[10px]">No hay contactos cargados.</div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En copia (CC)</label>
                                        <input 
                                            type="email"
                                            value={ccEmail}
                                            onChange={(e) => setCcEmail(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                                            placeholder="socio@familia.com"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asunto</label>
                                        <input 
                                            type="text" 
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Template Selection: SPANISH */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estilo de Plantilla</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'manual', label: 'LIBRE' },
                                            { id: 'new_policy', label: 'NUEVA' },
                                            { id: 'pre_renewal', label: 'PRE-RENO' },
                                            { id: 'renewal', label: 'RENOVACIÓN' },
                                            { id: 'overdue', label: 'ATRASO' },
                                            { id: 'birthday', label: 'CUMPLE' }
                                        ].map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setCategory(cat.id as EmailCategory)}
                                                className={`p-3 rounded-xl border text-[9px] font-black uppercase tracking-tighter transition-all text-center
                                                    ${category === cat.id 
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                                        : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'}`}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Attachments Visibility IMPROVED */}
                                <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-3xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-indigo-900/60 uppercase tracking-widest flex items-center gap-2">
                                            <Paperclip className="w-3 h-3" /> Archivos del Expediente
                                        </label>
                                        <span className="text-[9px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-100">
                                            {selectedDocs.length} Seleccionados
                                        </span>
                                    </div>
                                    <div className="bg-white/80 border border-indigo-100 rounded-2xl overflow-hidden max-h-[180px] overflow-y-auto custom-scrollbar">
                                        {documents.length > 0 ? documents.map((doc) => (
                                            <button 
                                                key={doc.id}
                                                onClick={() => {
                                                    if (selectedDocs.includes(doc.id)) {
                                                        setSelectedDocs(selectedDocs.filter(id => id !== doc.id))
                                                    } else {
                                                        setSelectedDocs([...selectedDocs, doc.id])
                                                    }
                                                }}
                                                className={`w-full p-3.5 flex items-center justify-between border-b border-indigo-50 hover:bg-white transition-all
                                                    ${selectedDocs.includes(doc.id) ? 'bg-indigo-600/5' : ''}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-1.5 rounded-lg transition-colors ${selectedDocs.includes(doc.id) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                        <FileText className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className={`text-[10px] font-black uppercase ${selectedDocs.includes(doc.id) ? 'text-indigo-700' : 'text-slate-700'}`}>{doc.document_type}</p>
                                                        <p className="text-[8px] text-slate-400 truncate max-w-[200px] font-medium">{doc.name || 'documento.pdf'}</p>
                                                    </div>
                                                </div>
                                                {selectedDocs.includes(doc.id) ? (
                                                    <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                    </div>
                                                ) : (
                                                    <div className="w-5 h-5 border-2 border-slate-200 rounded-full" />
                                                )}
                                            </button>
                                        )) : (
                                            <div className="p-8 text-center text-[10px] text-slate-400 italic">No hay documentos en esta póliza.</div>
                                        )}
                                    </div>
                                </div>
 
                                {/* Video Proposals Selector NEW */}
                                {videoProposals.length > 0 && (
                                    <div className="p-5 bg-rose-50/50 border border-rose-100 rounded-3xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black text-rose-900/60 uppercase tracking-widest flex items-center gap-2">
                                                <ExternalLink className="w-3 h-3" /> Video-Propuesta V-Prop
                                            </label>
                                            <button 
                                                onClick={() => setSelectedVideoUrl("")}
                                                className="text-[8px] font-black text-rose-600 uppercase"
                                            >
                                                LIMPIAR
                                            </button>
                                        </div>
                                        <div className="bg-white/80 border border-rose-100 rounded-2xl overflow-hidden max-h-[120px] overflow-y-auto custom-scrollbar">
                                            {videoProposals.map((vid) => (
                                                <button 
                                                    key={vid.id}
                                                    onClick={() => setSelectedVideoUrl(vid.file_url)}
                                                    className={`w-full p-3 flex items-center justify-between border-b border-rose-50 hover:bg-white transition-all
                                                        ${selectedVideoUrl === vid.file_url ? 'bg-rose-600/5' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-1.5 rounded-lg transition-colors ${selectedVideoUrl === vid.file_url ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className={`text-[10px] font-black uppercase ${selectedVideoUrl === vid.file_url ? 'text-rose-700' : 'text-slate-700'}`}>{vid.name || 'Video Presentación'}</p>
                                                            <p className="text-[8px] text-slate-400 truncate max-w-[200px] font-medium italic">Click para pre-visualizar botón</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
 
                                {/* Custom Message Input */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Edit3 className="w-3 h-3" /> Mensaje Personalizado
                                    </label>
                                    <textarea 
                                        value={customMessage}
                                        onChange={(e) => setCustomMessage(e.target.value)}
                                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-medium text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none resize-none transition-all italic min-h-[140px]"
                                        placeholder="Escribe el cuerpo del mensaje aquí. Se inyectará automáticamente en el diseño premium."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Preview Wrapper */}
                        <div className={`flex-1 bg-slate-200/40 flex flex-col items-center justify-center p-8 transition-all duration-500 ${!showPreview ? 'hidden' : ''}`}>
                            <div className="w-full h-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white">
                                <div className="px-8 py-5 bg-slate-900 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Sparkles className="w-3 h-3 text-indigo-400" /> Vista Previa del Cliente
                                    </span>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-white">
                                    <div 
                                        className="transform origin-top scale-[0.85] lg:scale-100"
                                        dangerouslySetInnerHTML={{ __html: body }} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer: Action Buttons */}
                    <div className="p-8 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Tracking Activo</span>
                            </div>
                            <button 
                                onClick={() => handleSend(true)}
                                disabled={sending || !hasSmtpConfig}
                                className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:border-indigo-400 hover:text-indigo-600 transition-all disabled:opacity-50"
                            >
                                <UserCheck className="w-4 h-4" /> Envío de Prueba (Self)
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={onClose}
                                className="px-8 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                            >
                                Borrador
                            </button>
                            <button 
                                onClick={() => handleSend(false)}
                                disabled={sending || sent || !hasSmtpConfig}
                                className={`px-12 py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl
                                    ${sent 
                                        ? 'bg-emerald-600 text-white shadow-emerald-100' 
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95 shadow-indigo-200'}
                                    ${(sending || !hasSmtpConfig) ? 'opacity-70 cursor-not-allowed grayscale' : ''}`}
                            >
                                {sending ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Despachando...</>
                                ) : sent ? (
                                    <><CheckCircle2 className="w-4 h-4" /> ¡Enviado con Éxito!</>
                                ) : (
                                    <><Send className="w-4 h-4" /> Enviar Ahora</>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
