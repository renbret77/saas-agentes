"use client"

import { useEffect, useState } from "react"
import { Plus, Search, MoreHorizontal, Phone, Mail, User, ChevronRight, FileText, AlertCircle, CheckCircle2, Clock, X, Zap, Shield, Sparkles, TrendingUp, Handshake, Send } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Database } from "@/types/database.types"
import ClientProtectionMap from "@/components/dashboard/ClientProtectionMap"
import EmailComposer from "@/components/dashboard/EmailComposer"

type Client = Database['public']['Tables']['clients']['Row']
type Policy = Database['public']['Tables']['policies']['Row']

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [clientPolicies, setClientPolicies] = useState<any[]>([])
    const [loadingPolicies, setLoadingPolicies] = useState(false)
    const [showOpportunityFeedback, setShowOpportunityFeedback] = useState(false)
    const [isComposerOpen, setIsComposerOpen] = useState(false)
    const [composerCategory, setComposerCategory] = useState<any>('manual')

    useEffect(() => {
        fetchClients()
    }, [])

    const fetchClients = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setClients(data || [])
        } catch (error) {
            console.error('Error loading clients:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchClientPolicies = async (clientId: string) => {
        setLoadingPolicies(true)
        const { data } = await supabase
            .from('policies')
            .select('*, insurance_lines(name)')
            .eq('client_id', clientId)
        setClientPolicies(data || [])
        setLoadingPolicies(false)
    }

    const handleSendPremiumProposal = async () => {
        if (!selectedClient) return
        
        setShowOpportunityFeedback(true)
        
        try {
            // Register Opportunity in CRM (prospects table)
            const { error } = await supabase
                .from('prospects')
                .insert({
                    name: `${selectedClient.first_name} ${selectedClient.last_name}`,
                    line_of_business: 'Venta Cruzada AI',
                    projected_value: 15000,
                    stage: 'lead',
                    phone: selectedClient.phone,
                    notes: `Oportunidad generada desde Consola 360. Cliente tiene ${clientPolicies.length} pólizas activas.`
                })

            if (error) console.error("Error creating prospect:", error)
        } catch (e) {
            console.error("CRM Sync Error:", e)
        }

        setTimeout(() => setShowOpportunityFeedback(false), 3000)
    }

    const filteredClients = clients.filter(client => {
        const search = searchTerm.toLowerCase();
        return (
            client.first_name?.toLowerCase().includes(search) ||
            client.last_name?.toLowerCase().includes(search) ||
            client.email?.toLowerCase().includes(search) ||
            client.secondary_email?.toLowerCase().includes(search) ||
            (client as any).mobile_phone?.includes(searchTerm) ||
            client.phone?.includes(searchTerm) ||
            (client as any).work_phone?.includes(searchTerm)
        )
    })

    return (
        <div className="flex h-[calc(100vh-160px)] gap-6 relative overflow-hidden">
            {/* Main List */}
            <div className={`flex-1 flex flex-col gap-6 transition-all duration-500 ${selectedClient ? 'max-w-[55%]' : 'max-w-full'}`}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cartera de Clientes</h1>
                        <p className="text-slate-500 text-sm font-medium">Gestiona tu base instalada con Inteligencia 360.</p>
                    </div>
                    <Link href="/dashboard/clients/new" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-black transition-all shadow-lg shadow-emerald-200/50 hover:scale-[1.02] active:scale-95 text-xs uppercase tracking-wider">
                        <Plus className="w-5 h-5" />
                        Nuevo Asegurado
                    </Link>
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o teléfono..."
                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm tracking-tight"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Clients Grid/Table */}
                <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
                    <div className="overflow-y-auto custom-scrollbar flex-1">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-10">
                                <tr className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] bg-slate-50/50">
                                    <th className="px-6 py-4">Asegurado</th>
                                    <th className="px-6 py-4 hidden md:table-cell">Contacto Completo</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-right">Detalle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredClients.map((client) => (
                                    <tr 
                                        key={client.id} 
                                        onClick={() => {
                                            setSelectedClient(client);
                                            fetchClientPolicies(client.id);
                                        }}
                                        className={`group cursor-pointer transition-all ${selectedClient?.id === client.id ? 'bg-emerald-50/30' : 'hover:bg-slate-50/80'}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm transition-all group-hover:scale-110 ${selectedClient?.id === client.id ? 'bg-emerald-600 text-white rotate-6' : 'bg-slate-100 text-slate-500'}`}>
                                                    {client.first_name?.[0] || '?'}{client.last_name?.[0] || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm tracking-tighter uppercase">{client.first_name} {client.last_name}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold tracking-widest">ID PROTECCIÓN • {client.id.slice(0, 8).toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="text-[11px] font-bold text-slate-500 flex flex-col gap-1">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 opacity-30 text-emerald-500" /> {client.email || 'Sin email'}</div>
                                                    {client.secondary_email && <div className="flex items-center gap-1.5 pl-5 opacity-60 text-[9px] italic line-clamp-1">{client.secondary_email}</div>}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {(client as any).mobile_phone && (
                                                        <div className="flex items-center gap-1.5 text-emerald-600">
                                                            <Zap className="w-3.5 h-3.5 fill-emerald-500 opacity-30" /> 
                                                            {(client as any).mobile_phone}
                                                        </div>
                                                    )}
                                                    {client.phone && client.phone !== (client as any).mobile_phone && (
                                                        <div className="flex items-center gap-1.5 opacity-60">
                                                            <Phone className="w-3.5 h-3.5 opacity-30 " /> {client.phone}
                                                        </div>
                                                    )}
                                                    {!(client as any).mobile_phone && !client.phone && (
                                                        <div className="text-[9px] text-slate-300 italic">Sin teléfono</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border
                                                ${client.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    client.status === 'lead' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                        'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                {client.status === 'active' ? '● Activo' : client.status === 'lead' ? '○ Prospecto' : '■ Baja'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ChevronRight className={`w-5 h-5 ml-auto transition-transform ${selectedClient?.id === client.id ? 'text-emerald-500 translate-x-1 scale-125' : 'text-slate-200 opacity-0 group-hover:opacity-100'}`} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Intelligence Side Panel */}
            <AnimatePresence>
                {selectedClient && (
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="w-[45%] bg-white border-l border-slate-200 shadow-2xl flex flex-col z-20 relative"
                    >
                        {/* Status Feedback Overlay */}
                        <AnimatePresence>
                            {showOpportunityFeedback && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="absolute inset-x-6 top-24 z-50 p-4 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center justify-between border border-emerald-400"
                                >
                                    <div className="flex items-center gap-3">
                                        <Sparkles className="w-5 h-5 fill-white" />
                                        <p className="text-xs font-black uppercase tracking-tight">Oportunidad Activada en CRM</p>
                                    </div>
                                    <CheckCircle2 className="w-5 h-5" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-[1.25rem] bg-slate-900 flex items-center justify-center text-white font-black text-lg shadow-xl shadow-slate-200">
                                    {selectedClient.first_name[0]}{selectedClient.last_name[0]}
                                </div>
                                <div>
                                    <h2 className="font-black text-slate-900 text-lg leading-tight tracking-tight uppercase">{selectedClient.first_name} {selectedClient.last_name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Inteligencia 360 Activa</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link 
                                    href={`/dashboard/clients/${selectedClient.id}`}
                                    className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl transition-all border border-slate-200 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider"
                                >
                                    <FileText className="w-4 h-4" />
                                    Editar Perfil
                                </Link>
                                <button onClick={() => setSelectedClient(null)} className="p-2.5 hover:bg-slate-100 rounded-2xl transition-all border border-transparent hover:border-slate-200">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {/* Opportunity Map (The "WOW" part) */}
                            <ClientProtectionMap policies={clientPolicies} />

                            {/* Policies List */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em] flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-emerald-500" /> Cobertura Actual
                                    </h3>
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black rounded-lg">
                                        {clientPolicies.length} ACTIVA{clientPolicies.length === 1 ? '' : 'S'}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {loadingPolicies ? (
                                        <div className="py-20 text-center animate-pulse">
                                            <div className="w-8 h-8 bg-slate-100 rounded-full mx-auto mb-4" />
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Rastreando bibliotecas...</p>
                                        </div>
                                    ) : clientPolicies.length > 0 ? (
                                        clientPolicies.map(policy => (
                                            <div key={policy.id} className="p-5 bg-slate-50 border border-slate-100 rounded-3xl hover:border-emerald-200 transition-all group relative overflow-hidden shadow-sm">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="text-xs font-black text-slate-900 uppercase mb-1">{(policy.policy_data as any)?.model || 'Póliza ' + (policy.insurance_lines?.name || 'Gral')}</p>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                                            <p className="text-[10px] font-bold text-slate-400 tracking-wide">CERTIFICADO: {policy.policy_number}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-slate-900 uppercase">${(policy.premium_total || 0).toLocaleString()}</p>
                                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{policy.status}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-12 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                                            <AlertCircle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Cero pólizas activas</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Intelligent Sales Engine */}
                            <div className="space-y-6">
                                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em] flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-indigo-500" /> Máquina de Crecimiento
                                </h3>

                                <div className="grid grid-cols-1 gap-3">
                                    <button 
                                        onClick={handleSendPremiumProposal}
                                        className="w-full p-5 bg-indigo-600 text-white rounded-3xl font-black text-xs flex items-center justify-between shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all group overflow-hidden relative"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform">
                                            <Handshake className="w-12 h-12" />
                                        </div>
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                                                <Sparkles className="w-5 h-5 fill-white" />
                                            </div>
                                            <div className="text-left">
                                                <p className="uppercase tracking-widest text-[9px] font-black text-indigo-100">Campaña Cross-Sell</p>
                                                <p className="text-sm">Mandar Presentación Premium</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 relative z-10 opacity-50" />
                                    </button>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => {
                                                setComposerCategory('manual');
                                                setIsComposerOpen(true);
                                            }}
                                            className="p-4 bg-white border border-slate-100 rounded-[1.5rem] font-black text-[10px] text-slate-600 hover:border-indigo-200 hover:text-indigo-600 transition-all flex flex-col items-center gap-2 group"
                                        >
                                            <div className="p-2 bg-slate-50 group-hover:bg-indigo-50 rounded-xl transition-colors"><Mail className="w-4 h-4" /></div>
                                            ENVIAR CORREO
                                        </button>
                                        <button className="p-4 bg-white border border-slate-100 rounded-[1.5rem] font-black text-[10px] text-slate-600 hover:border-slate-300 transition-all flex flex-col items-center gap-2">
                                            <div className="p-2 bg-slate-50 rounded-xl"><FileText className="w-4 h-4" /></div>
                                            ESTADO DE CUENTA
                                        </button>
                                        <button className="p-4 bg-white border border-slate-100 rounded-[1.5rem] font-black text-[10px] text-slate-600 hover:border-rose-200 transition-all flex flex-col items-center gap-2">
                                            <div className="p-2 bg-rose-50 text-rose-500 rounded-xl"><Zap className="w-4 h-4 fill-rose-500" /></div>
                                            REPORTAR SINIESTRO
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Email Composer Integration */}
            {selectedClient && (
                <EmailComposer 
                    isOpen={isComposerOpen}
                    onClose={() => setIsComposerOpen(false)}
                    client={selectedClient as any}
                    initialCategory={composerCategory}
                    policyData={clientPolicies[0]}
                />
            )}
        </div>
    )
}
