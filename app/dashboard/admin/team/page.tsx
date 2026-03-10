"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Shield, Plus, Save, Trash2, Check, X, Key, UserPlus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { inviteAssistant, togglePermission } from "./actions"

type Assistant = {
    id: string
    full_name: string
    avatar_url: string
    permissions: {
        can_manage_clients: boolean
        can_view_financials: boolean
        can_manage_claims: boolean
        can_manage_quotes: boolean
    }
}

export default function TeamPage() {
    const [assistants, setAssistants] = useState<Assistant[]>([])
    const [loading, setLoading] = useState(true)
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [inviteForm, setInviteForm] = useState({ name: "", email: "", password: "" })
    const [inviteLoading, setInviteLoading] = useState(false)
    const [agentId, setAgentId] = useState<string | null>(null)

    useEffect(() => {
        fetchTeam()
    }, [])

    const fetchTeam = async () => {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return setLoading(false)
        setAgentId(session.user.id)

        // Fetch profiles where parent_id = me
        const { data: profiles, error: profErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('parent_id', session.user.id)
            .eq('role', 'assistant')

        if (profErr || !profiles) {
            console.error(profErr)
            return setLoading(false)
        }

        // Fetch permissions for these assistants
        const assistantIds = profiles.map(p => p.id)
        let permsData: any[] = []
        if (assistantIds.length > 0) {
            const { data: perms } = await supabase
                .from('assistant_permissions')
                .select('*')
                .in('assistant_id', assistantIds)
            permsData = perms || []
        }

        const mapped = profiles.map(p => {
            const perm = permsData.find(pm => pm.assistant_id === p.id) || {
                can_manage_clients: false,
                can_view_financials: false,
                can_manage_claims: false,
                can_manage_quotes: false
            }
            return {
                id: p.id,
                full_name: p.full_name || "Asistente",
                avatar_url: p.avatar_url,
                permissions: perm
            }
        })

        setAssistants(mapped)
        setLoading(false)
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!agentId) return
        setInviteLoading(true)

        const formData = new FormData()
        formData.append("name", inviteForm.name)
        formData.append("email", inviteForm.email)
        formData.append("password", inviteForm.password)
        formData.append("agent_id", agentId)

        const res = await inviteAssistant(formData)
        setInviteLoading(false)

        if (res?.error) {
            alert("Error al invitar: " + res.error)
        } else {
            setShowInviteModal(false)
            setInviteForm({ name: "", email: "", password: "" })
            fetchTeam()
        }
    }

    const handleToggle = async (assistantId: string, permissionKey: keyof Assistant["permissions"], currentValue: boolean) => {
        // Optimistic UI update
        setAssistants(prev => prev.map(a =>
            a.id === assistantId ? { ...a, permissions: { ...a.permissions, [permissionKey]: !currentValue } } : a
        ))

        const res = await togglePermission(assistantId, permissionKey, !currentValue)
        if (res?.error) {
            alert("Error al guardar permiso: " + res.error)
            fetchTeam() // revert on error
        }
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Users className="text-emerald-500" /> Mi Equipo
                    </h1>
                    <p className="text-slate-500 mt-2">Gestiona el acceso y permisos de tus asistentes.</p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                    <UserPlus className="w-5 h-5" /> Invitar Asistente
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-20 text-slate-500">Cargando equipo...</div>
            ) : assistants.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                    <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Aún no tienes asistentes</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">Invita a miembros de tu equipo para delegar la gestión operativa sin exponer información financiera sensible.</p>
                    <button onClick={() => setShowInviteModal(true)} className="px-6 py-3 bg-white border border-slate-200 text-emerald-600 font-bold rounded-xl shadow-sm hover:border-emerald-200 transition-colors">
                        Invitar a mi primer asistente
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {assistants.map((assistant) => (
                        <motion.div
                            key={assistant.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border text-left border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col lg:flex-row"
                        >
                            {/* Profile Info */}
                            <div className="p-6 bg-slate-50 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-200 flex items-center gap-4">
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-2xl">
                                    {assistant.full_name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">{assistant.full_name}</h3>
                                    <span className="inline-block px-2 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded-md mt-1 uppercase tracking-wide">Asistente</span>
                                </div>
                            </div>

                            {/* Permissions Grid */}
                            <div className="p-6 lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">Cobranza y Fintec</p>
                                        <p className="text-xs text-slate-500">Ver primas, comisiones y wallet.</p>
                                    </div>
                                    <button
                                        onClick={() => handleToggle(assistant.id, 'can_view_financials', assistant.permissions.can_view_financials)}
                                        className={`w-12 h-6 rounded-full relative transition-colors ${assistant.permissions.can_view_financials ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${assistant.permissions.can_view_financials ? 'translate-x-7' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">Catálogo de Clientes</p>
                                        <p className="text-xs text-slate-500">Crear y editar prospectos/clientes.</p>
                                    </div>
                                    <button
                                        onClick={() => handleToggle(assistant.id, 'can_manage_clients', assistant.permissions.can_manage_clients)}
                                        className={`w-12 h-6 rounded-full relative transition-colors ${assistant.permissions.can_manage_clients ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${assistant.permissions.can_manage_clients ? 'translate-x-7' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">Gestión de Siniestros</p>
                                        <p className="text-xs text-slate-500">Apertura y carga de documentos.</p>
                                    </div>
                                    <button
                                        onClick={() => handleToggle(assistant.id, 'can_manage_claims', assistant.permissions.can_manage_claims)}
                                        className={`w-12 h-6 rounded-full relative transition-colors ${assistant.permissions.can_manage_claims ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${assistant.permissions.can_manage_claims ? 'translate-x-7' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">Cotizador y Emisión</p>
                                        <p className="text-xs text-slate-500">Emitir pólizas y certificados.</p>
                                    </div>
                                    <button
                                        onClick={() => handleToggle(assistant.id, 'can_manage_quotes', assistant.permissions.can_manage_quotes)}
                                        className={`w-12 h-6 rounded-full relative transition-colors ${assistant.permissions.can_manage_quotes ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${assistant.permissions.can_manage_quotes ? 'translate-x-7' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Key className="w-5 h-5 text-emerald-500" /> Nuevo Asistente</h2>
                            <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
                        </div>
                        <form onSubmit={handleInvite} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Completo</label>
                                <input type="text" required value={inviteForm.name} onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Ej. Ana Laura" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Correo Electrónico</label>
                                <input type="email" required value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="ana@agencia.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Contraseña Temporal</label>
                                <input type="password" required value={inviteForm.password} onChange={e => setInviteForm({ ...inviteForm, password: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="••••••••" />
                            </div>
                            <div className="pt-4">
                                <button type="submit" disabled={inviteLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2">
                                    {inviteLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus className="w-5 h-5" /> Crear Cuenta</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
