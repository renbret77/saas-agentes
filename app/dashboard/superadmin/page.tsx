"use client"

import { useState, useEffect } from "react"
import { ShieldCheck, Users, Briefcase, Plus, Search, Activity, PhoneOff, CheckCircle2, ShieldAlert, X, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { createAgencyAndAdmin, updateAgencyStatus } from "./actions"

export default function SuperAdminPage() {
    const [agencies, setAgencies] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")

    useEffect(() => {
        fetchAgencies()
    }, [])

    const fetchAgencies = async () => {
        // En un escenario real, esto se haría via Server Action para máxima seguridad,
        // pero usando RLS, Supabase solo devolverá filas si el usuario actual es 'superadmin'.
        const { data, error } = await supabase
            .from('agencies')
            .select(`
                *,
                profiles (count)
            `)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setAgencies(data)
        }
        setLoading(false)
    }

    const handleCreateAgency = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setErrorMsg("")
        setIsSubmitting(true)

        const formData = new FormData(e.currentTarget)
        const res = await createAgencyAndAdmin(formData)

        if (res.error) {
            setErrorMsg(res.error)
            setIsSubmitting(false)
            return
        }

        setIsModalOpen(false)
        setIsSubmitting(false)
        fetchAgencies() // Recargar datos
    }

    const handleToggleStatus = async (agencyId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
        await updateAgencyStatus(agencyId, newStatus)
        fetchAgencies()
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 p-6">
            {/* Header Módulo Super Admin */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Centro de Control Global</h1>
                    </div>
                    <p className="text-slate-500">Módulo de Súper Administrador. Gestiona agencias, tenencias y licencias operativas.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Agencia
                    </button>
                </div>
            </div>

            {/* KPIs Generales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Briefcase className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{agencies.length}</p>
                    <p className="text-sm font-medium text-slate-500 mt-1">Agencias Totales</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{agencies.filter(a => a.status === 'active').length}</p>
                    <p className="text-sm font-medium text-slate-500 mt-1">Licencias Activas</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{agencies.filter(a => a.license_type === 'free').length}</p>
                    <p className="text-sm font-medium text-slate-500 mt-1">Cuentas Free (Riesgo)</p>
                </div>

                <div className="bg-indigo-600 p-6 rounded-2xl border border-indigo-500 shadow-sm text-white">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/20 text-white rounded-xl">
                            <Activity className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-white">Saludable</p>
                    <p className="text-sm font-medium text-indigo-100 mt-1">Estatus del Sistema</p>
                </div>
            </div>

            {/* Tabla de Agencias */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">Agencias / Promotorías Registradas</h2>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o CNSF..."
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">Agencia / Promotoría</th>
                                <th className="px-6 py-4">Nivel de Licencia</th>
                                <th className="px-6 py-4">Teléfono Admin (Anti-Abuso)</th>
                                <th className="px-6 py-4">Límites</th>
                                <th className="px-6 py-4">Estatus</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {agencies.map((agency) => (
                                <tr key={agency.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                                {agency.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{agency.name}</p>
                                                <p className="text-xs text-slate-500">CNSF: {agency.cnsf_license || 'No registrada'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider
                                            ${agency.license_type === 'free' ? 'bg-slate-100 text-slate-600' :
                                                agency.license_type === 'pro' ? 'bg-indigo-100 text-indigo-700' : 'bg-fuchsia-100 text-fuchsia-700'}`}>
                                            {agency.license_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-medium">
                                        {agency.admin_phone ? agency.admin_phone : <span className="text-slate-400 italic">No verificado</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-xs">
                                            <span className="text-slate-600">Usuarios: {agency.profiles?.[0]?.count || 0}/{agency.max_users}</span>
                                            {agency.license_type === 'free' && (
                                                <span className="text-rose-600 font-bold">Límite duro: 20 Clientes</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${agency.status === 'active' ? 'bg-emerald-500' : agency.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`}></div>
                                            <span className="capitalize font-medium text-slate-700">{agency.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => handleToggleStatus(agency.id, agency.status)}
                                            className={`${agency.status === 'active' ? 'text-rose-600 hover:text-rose-800' : 'text-emerald-600 hover:text-emerald-800'} font-bold text-sm transition-colors`}
                                        >
                                            {agency.status === 'active' ? 'Suspender' : 'Activar'}
                                        </button>
                                        <button className="text-indigo-600 hover:text-indigo-800 font-bold text-sm transition-colors ml-4">
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {agencies.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        No hay agencias operando en la plataforma todavía.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Crear Nueva Agencia */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Crear Nueva Agencia</h3>
                                <p className="text-sm text-slate-500">Registra un Promotor y otórgale una licencia de uso.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateAgency} className="p-6 space-y-5">
                            {errorMsg && (
                                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold rounded-xl flex gap-2 items-center">
                                    <ShieldAlert className="w-4 h-4" /> {errorMsg}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nombre de la Agencia / Promotoria</label>
                                <input required type="text" name="agency_name" placeholder="Ej. Seguros Diamante" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Nivel de Licencia</label>
                                    <select name="license_type" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium">
                                        <option value="free">Free (Grátis - Máx 20 Clientes)</option>
                                        <option value="pro">Pro (Agencia Mediana)</option>
                                        <option value="elite">Elite (Promotoría Ilimitada)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Cédula CNSF (Opcional por ahora)</label>
                                    <input type="text" name="cnsf_license" placeholder="CNSF-..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Credenciales del Agente Principal</h4>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Teléfono Móvil (Regla Anti-Abuso)</label>
                                    <input required type="tel" name="admin_phone" placeholder="55 1234 5678" className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    <p className="text-xs text-slate-400 mt-1">Este número será validado como ÚNICO en todo el sistema.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Correo Electrónico</label>
                                        <input required type="email" name="admin_email" placeholder="admin@agencia.com" className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Contraseña Temporal</label>
                                        <input required type="password" name="admin_password" placeholder="••••••••" minLength={6} className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:text-slate-700 transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50">
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Crear Agencia
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
