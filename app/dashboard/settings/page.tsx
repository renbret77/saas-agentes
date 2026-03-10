"use client"

import { useEffect, useState } from "react"
import {
    Settings as SettingsIcon,
    User,
    Mail,
    Shield,
    Zap,
    Key,
    Bell,
    Smartphone,
    CreditCard,
    ArrowUpRight,
    Wallet,
    Sparkles,
    Bot,
    Plus,
    AlertCircle,
    MessageSquare,
    ChevronRight,
    FileText,
    LayoutDashboard,
    RefreshCw
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const INSTANT_TEMPLATES: any = {
    pre_due: {
        amistoso: [
            "¡Hola {{nombre_cliente}}! ✨ Te aviso que tu póliza de {{ramo}} para su {{descripción}} con {{aseguradora}} (Póliza: {{póliza}}) vence el {{vencimiento}}. Corresponde al recibo {{número_recibo}} por {{monto}} {{moneda}}. ¿Te ayudo con el pago?",
            "¡Qué tal {{nombre_cliente}}! 👋 Tu seguro de {{ramo}} ({{descripción}}) con {{aseguradora}} tiene un pago pendiente para el {{vencimiento}} por {{monto}} {{moneda}}. ¡Sigamos protegidos!",
            "Hola {{nombre_cliente}} ✨ Recordatorio preventivo: el recibo {{número_recibo}} de {{aseguradora}} para su {{descripción}} inicia el {{vencimiento}}. El monto es {{monto}} {{moneda}}. Te sugiero el pago pronto."
        ],
        profesional: [
            "Estimado/a {{nombre_cliente}}, le informamos que el recibo {{número_recibo}} de su póliza {{póliza}} ({{ramo}} - {{descripción}}) con {{aseguradora}} vence el {{vencimiento}}. El monto es de {{monto}} {{moneda}}.",
            "Aviso de Cobranza: Su póliza {{póliza}} con {{aseguradora}} para su {{descripción}} cuenta con un vencimiento el {{vencimiento}}. Pago de {{monto}} {{moneda}} correspondiente al recibo {{número_recibo}}.",
            "Recordatorio de Seguro: Le recordamos que su protección de {{ramo}} para {{descripción}} con {{aseguradora}} vence el {{vencimiento}}. El monto a cubrir es {{monto}} {{moneda}}."
        ],
        directo: [
            "Referencia: {{descripción}} - {{aseguradora}}. Póliza: {{póliza}}. Recibo: {{número_recibo}}. Vence: {{vencimiento}}. Monto: {{monto}} {{moneda}}. Favor de pagar.",
            "Recordatorio de pago: {{aseguradora}} ({{descripción}}). Póliza {{póliza}}. Recibo {{número_recibo}}. Vence el {{vencimiento}}. Pago: {{monto}} {{moneda}}.",
            "Cobranza Preventiva: Su póliza {{póliza}} ({{descripción}}) con {{aseguradora}} vence el {{vencimiento}}. Monto: {{monto}} {{moneda}}."
        ],
        urgente: [
            "¡ATENCIÓN! Su póliza {{póliza}} para {{descripción}} con {{aseguradora}} vence en pocos días ({{vencimiento}}). Pago urgente del recibo {{número_recibo}} por {{monto}} {{moneda}}.",
            "URGENTE: Evite la cancelación de su protección en {{aseguradora}} para {{descripción}}. El recibo {{número_recibo}} vence el {{vencimiento}}. Pago: {{monto}} {{moneda}}.",
            "AVISO CRÍTICO: Su seguro de {{ramo}} ({{descripción}}) en {{aseguradora}} vence el {{vencimiento}}. No arriesgue su patrimonio. Monto: {{monto}} {{moneda}}."
        ]
    },
    grace_period: {
        amistoso: [
            "¡Hola {{nombre_cliente}}! 👋 Tu recibo {{número_recibo}} de {{aseguradora}} para {{descripción}} ya venció el {{vencimiento}}. Recuerda que aunque estés en PERIODO DE GRACIA (protegido hasta el {{fecha_limite}}), si ocurre un siniestro hoy la aseguradora te pedirá el pago inmediato o podría ser vía reembolso. ¡Evitemos ese trámite, te ayudo con la ficha!",
            "¿Qué tal {{nombre_cliente}}? ✨ Tu póliza {{póliza}} ({{descripción}}) con {{aseguradora}} está en gracia. ¡Sigo cuidando tu patrimonio! Tómalo en cuenta: tener un siniestro sin el pago liquidado puede complicar el proceso administrativo. Liquidemos los {{monto}} {{moneda}} antes del {{fecha_limite}}.",
            "Hola {{nombre_cliente}}, tu póliza {{póliza}} de {{aseguradora}} para {{descripción}} sigue vigente pero el tiempo corre. Tienes hasta el {{fecha_limite}} para liquidar {{monto}} {{moneda}}. ¡Dato importante! En caso de SINIESTRO, es mucho más sencillo si el recibo ya está pagado. ¿Te mando el link?"
        ],
        profesional: [
            "Estimado/a {{nombre_cliente}}, su póliza {{póliza}} con {{aseguradora}} ({{descripción}}) se encuentra en periodo de gracia. Le sugerimos liquidar su recibo de {{monto}} {{moneda}} antes del {{fecha_limite}}. Es importante notar que ante un siniestro, la aseguradora suele condicionar la atención al pago total o trámite de reembolso.",
            "Aviso de Gracia: Su recibo {{número_recibo}} de {{aseguradora}} para su {{descripción}} está pendiente (venció el {{vencimiento}}). Recomendamos regularizar su pago antes del {{fecha_limite}} para evitar complicaciones administrativas o la necesidad de pago por reembolso en caso de reclamación.",
            "Vigencia en Riesgo: Su seguro de {{ramo}} para {{descripción}} en {{aseguradora}} está en periodo de gracia. Contar con su pago de {{monto}} {{moneda}} antes del {{fecha_limite}} garantiza una respuesta inmediata ante SINIESTROS, sin trámites adicionales de cobranza."
        ],
        directo: [
            "En Gracia: Póliza {{póliza}} ({{descripción}}) - {{aseguradora}}. Fecha límite: {{fecha_limite}}. Monto: {{monto}} {{moneda}}. Nota aclaratoria: Reportar un siniestro sin pago liquidado puede requerir liquidación inmediata o reembolso posterior.",
            "Aviso: Pago pendiente {{aseguradora}} {{póliza}} ({{descripción}}). Estamos en periodo de gracia. Fecha límite: {{fecha_limite}}. Evite retrasos en atención de siniestros por falta de pago. Monto: {{monto}} {{moneda}}.",
            "Cobranza Educación: Su protección para {{descripción}} está en periodo de gracia. Pague antes del {{fecha_limite}} para garantizar cobertura directa. Sin pago, la aseguradora puede aplicar políticas de reembolso ante siniestros."
        ],
        urgente: [
            "¡ATENCIÓN! Su póliza {{póliza}} para {{descripción}} con {{aseguradora}} está en periodo de gracia CRÍTICO. Si ocurre un siniestro hoy, la aseguradora le exigirá el pago total para responder. Pague {{monto}} antes del {{fecha_limite}} y evite riesgos innecesarios.",
            "URGENTE: Últimos días de protección para {{descripción}} en {{aseguradora}}. Evite la cancelación definitiva el {{fecha_limite}}. Un siniestro sin pago liquidado es un riesgo administrativo grave. Pago pendiente: {{monto}} {{moneda}}.",
            "AVISO CRÍTICO: Usted tiene hasta el {{fecha_limite}} para pagar el recibo {{número_recibo}} de {{aseguradora}}. No ponga en riesgo su derecho a la atención inmediata. Sin pago, su cobertura para {{descripción}} podría verse afectada o requerir reembolso."
        ]
    },
    expired: {
        amistoso: [
            "Hola {{nombre_cliente}}, ✨ pasaba a saludarte y comentarte que la póliza de {{descripción}} con {{aseguradora}} ha perdido vigencia. Cuéntame, ¿sucedió algo con lo que te pueda apoyar? Me encantaría ayudarte a recuperar tu protección hoy mismo.",
            "¡Hola {{nombre_cliente}}! 👋 Notamos que tu protección con {{aseguradora}} para {{descripción}} ha expirado. ¡No te desprotejas! Estoy a tus órdenes para ver opciones de rehabilitación de tu póliza {{póliza}} y que sigas tranquilo.",
            "¡Qué tal {{nombre_cliente}}! Tu póliza {{póliza}} de {{aseguradora}} para {{descripción}} ya no está vigente. ¿Te ayudo con los trámites para reactivarla? Mi prioridad es que tu patrimonio vuelva a estar seguro lo antes posible."
        ],
        profesional: [
            "Estimado/a {{nombre_cliente}}, notamos que su protección de {{ramo}} para {{descripción}} en {{aseguradora}} ha quedado sin vigencia por falta de pago. ¿Habrá ocurrido algún inconveniente con el que podamos asistirle para rehabilitar su seguro?",
            "Aviso de Apoyo: Su póliza {{póliza}} para {{descripción}} con {{aseguradora}} se encuentra actualmente inactiva. Nos gustaría saber si desea que gestionemos la reactivación para garantizar que no permanezca sin protección.",
            "Estatus de Seguimiento: La protección para {{descripción}} en {{aseguradora}} ha vencido. Quedamos a su disposición para coordinar la rehabilitación de su póliza {{póliza}} y evitar cualquier interrupción de cobertura."
        ],
        directo: [
            "Estatus: Póliza {{póliza}} ({{descripción}}) - {{aseguradora}} terminada. ¿Desea que lo apoyemos con los trámites para rehabilitar su protección de inmediato?",
            "Recordatorio de Rehabilitación: Su seguro en {{aseguradora}} para {{descripción}} ya no está vigente. Estamos listos para asistirle en la reactivación si así lo requiere. Favor de contactarnos.",
            "Seguimiento: Póliza {{póliza}} ({{descripción}}) Vencida. Quedamos atentos para ayudarle a regularizar su situación de riesgo y recuperar su protección lo antes posible."
        ],
        urgente: [
            "AVISO DE APOYO URGENTE: Su póliza {{póliza}} para {{descripción}} con {{aseguradora}} se encuentra sin vigencia. Le sugerimos contactarnos de inmediato para gestionar su rehabilitación antes de que pierda sus derechos de antigüedad.",
            "PELIGRO DE DESPROTECCIÓN: Su patrimonio ({{descripción}}) está sin seguro actualmente. La póliza {{póliza}} ha expirado. ¿Cómo podemos ayudarle a regularizar esto hoy mismo para evitar riesgos mayores?",
            "SEGUIMIENTO CRÍTICO: La aseguradora ha dado por terminada la cobertura para {{descripción}}. Le ofrecemos nuestro apoyo total para buscar la rehabilitación de la póliza {{póliza}} a la brevedad posible."
        ]
    }
}

export default function SettingsPage() {
    const [profile, setProfile] = useState<any>(null)
    const [credits, setCredits] = useState<number>(0)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'profile' | 'connectivity' | 'security' | 'wallet' | 'notifications'>('profile')

    // SaaS Context Settings
    const [saasConfig, setSaasConfig] = useState({
        apiUrl: '',
        apiKey: '',
        instanceName: '',
        chatbotEnabled: false
    })

    const [notificationSettings, setNotificationSettings] = useState<any>({
        pre_due: { enabled: true, days_before: 5, variants: ["", "", ""], ai_tone: "profesional" },
        grace_period: { enabled: true, days_after: 2, variants: ["", "", ""], ai_tone: "profesional" },
        expired: { enabled: false, days_after: 5, variants: ["", "", ""], ai_tone: "urgente" }
    })

    const [isGenerating, setIsGenerating] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                setProfile(profile)

                const { data: creditData } = await supabase
                    .from('user_credits' as any)
                    .select('balance')
                    .single()

                if (creditData) setCredits((creditData as any).balance)

                // Fetch agent settings
                const { data: settings } = await (supabase.from('agent_settings') as any).select('*').eq('user_id', user.id).single()
                if (settings) {
                    setSaasConfig({
                        apiUrl: settings.evolution_api_url || '',
                        apiKey: settings.evolution_api_key || '',
                        instanceName: settings.whatsapp_instance_name || '',
                        chatbotEnabled: settings.chatbot_enabled || false
                    })
                }

                if (settings?.notification_settings) {
                    const ns = settings.notification_settings;
                    // Migrate on the fly if still using 'template' instead of 'variants'
                    ['pre_due', 'grace_period', 'expired'].forEach(type => {
                        if (ns[type] && ns[type].template !== undefined && !ns[type].variants) {
                            ns[type].variants = [ns[type].template, "", ""];
                            delete ns[type].template;
                        }
                    });
                    setNotificationSettings(ns)
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error)
        } finally {
            setLoading(false)
        }
    }

    const saveSaasConfig = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await (supabase.from('agent_settings') as any).upsert({
                user_id: user.id,
                evolution_api_url: saasConfig.apiUrl,
                evolution_api_key: saasConfig.apiKey,
                whatsapp_instance_name: saasConfig.instanceName,
                chatbot_enabled: saasConfig.chatbotEnabled,
                updated_at: new Date().toISOString()
            })

            if (error) throw error
            alert("Configuración de SaaS guardada con éxito")
        } catch (error: any) {
            alert("Error al guardar: " + error.message)
        }
    }

    const saveNotificationSettings = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await (supabase.from('agent_settings') as any).upsert({
                user_id: user.id,
                notification_settings: notificationSettings,
                updated_at: new Date().toISOString()
            })

            if (error) throw error
            alert("Reglas de notificaciones guardadas!")
        } catch (error: any) {
            alert("Error al guardar: " + error.message)
        }
    }

    const generateWithAI = async (type: 'pre_due' | 'grace_period' | 'expired') => {
        try {
            setIsGenerating(true)
            const response = await fetch('/api/ai/draft-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    tone: notificationSettings[type].ai_tone || 'profesional',
                    currentText: notificationSettings[type].variants[0]
                })
            })
            const data = await response.json()
            if (data.variants && Array.isArray(data.variants)) {
                setNotificationSettings({
                    ...notificationSettings,
                    [type]: { ...notificationSettings[type], variants: data.variants }
                })
            }
        } catch (error) {
            console.error("Error generating with AI:", error)
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <SettingsIcon className="w-8 h-8 text-slate-700" /> Configuración SaaS
                </h1>
                <p className="text-slate-500 mt-1">Administra tu perfil, seguridad y conexiones de WhatsApp API.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Left Column: Navigation Tabs */}
                <div className="space-y-2">
                    {[
                        { id: 'profile', icon: User, label: 'Perfil General' },
                        { id: 'connectivity', icon: Smartphone, label: 'WhatsApp & Bot' },
                        { id: 'security', icon: Key, label: 'Seguridad' },
                        { id: 'wallet', icon: Wallet, label: 'Billetera IA' },
                        { id: 'notifications', icon: Bell, label: 'Notificaciones' },
                    ].map((item: any) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                                activeTab === item.id
                                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <item.icon className="w-4 h-4" /> {item.label}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-3 space-y-8">
                    {activeTab === 'profile' && (
                        <div className="bg-white rounded-[40px] border border-slate-200 p-8 md:p-12 shadow-xl space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Datos del Agente</h3>
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <User className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo</label>
                                    <input
                                        type="text"
                                        value={profile?.full_name || ""}
                                        readOnly
                                        className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol</label>
                                    <input
                                        type="text"
                                        value={profile?.role?.toUpperCase() || "ADMIN"}
                                        readOnly
                                        className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-emerald-600 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Corporativo</label>
                                <input
                                    type="email"
                                    value={profile?.email || "agente@segurosrb.mx"}
                                    readOnly
                                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none"
                                />
                            </div>

                            <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
                                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                    La edición de perfiles está centralizada. Si necesitas cambiar tu nombre o email, contacta a soporte corporativo.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'connectivity' && (
                        <div className="bg-white rounded-[40px] border border-slate-200 p-8 md:p-12 shadow-xl space-y-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Canal de Comunicación</h3>
                                    <div className="text-[8px] text-slate-500 font-mono tracking-widest mt-0.5">
                                        VER 04-03-2026 08:00 PM 🚀
                                    </div>
                                </div>
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                    <Smartphone className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="grid grid-cols-1 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gateway URL</label>
                                        <input
                                            type="text"
                                            placeholder="https://instancia.evolution-api.com"
                                            value={saasConfig.apiUrl}
                                            onChange={(e) => setSaasConfig({ ...saasConfig, apiUrl: e.target.value })}
                                            className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global API Key</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••••••••••"
                                            value={saasConfig.apiKey}
                                            onChange={(e) => setSaasConfig({ ...saasConfig, apiKey: e.target.value })}
                                            className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-900 rounded-[32px] flex items-center justify-between text-white shadow-2xl">
                                    <div className="flex items-center gap-5">
                                        <div className={cn("p-4 rounded-[20px] transition-all", saasConfig.chatbotEnabled ? "bg-emerald-500" : "bg-slate-800 text-slate-500")}>
                                            <Bot className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black tracking-tight">Chatbot de Autoservicio</p>
                                            <p className="text-xs text-slate-400">Tus clientes podrán consultar sus pólizas 24/7.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={saasConfig.chatbotEnabled}
                                            onChange={(e) => setSaasConfig({ ...saasConfig, chatbotEnabled: e.target.checked })}
                                        />
                                        <div className="w-14 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white"></div>
                                    </label>
                                </div>

                                <button
                                    onClick={saveSaasConfig}
                                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-lg shadow-indigo-100"
                                >
                                    Vincular Canal & Guardar
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'wallet' && (
                        <div className="bg-white rounded-[40px] border border-slate-200 p-8 md:p-12 shadow-xl space-y-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Billetera de Créditos IA</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Saldo para automatizaciones y reportes</p>
                                </div>
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <Wallet className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="bg-slate-900 rounded-[32px] p-10 text-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
                                    <Sparkles className="w-32 h-32 text-indigo-400" />
                                </div>
                                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Saldo Disponible</p>
                                <div className="flex items-center justify-center gap-4">
                                    <span className="text-5xl font-black text-white tracking-tighter">${credits.toFixed(2)}</span>
                                    <div className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full">
                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">USD</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recargar Crédito vía Stripe</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {[
                                        { amount: 10, credits: 10, reward: "" },
                                        { amount: 50, credits: 55, reward: "+5 Bonus" },
                                        { amount: 100, credits: 120, reward: "+20 Bonus" },
                                    ].map((plan, i) => (
                                        <button
                                            key={i}
                                            className="p-6 border border-slate-100 bg-slate-50 rounded-3xl hover:border-indigo-500 hover:bg-white transition-all group relative overflow-hidden"
                                            onClick={() => alert(`Iniciando pago Stripe de $${plan.amount} USD`)}
                                        >
                                            {plan.reward && (
                                                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-bl-xl uppercase">
                                                    {plan.reward}
                                                </div>
                                            )}
                                            <p className="text-2xl font-black text-slate-900">${plan.amount}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{plan.credits} Créditos</p>
                                            <Zap className="w-4 h-4 text-indigo-400 mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm">
                                        <CreditCard className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-900 uppercase">Suscripción SaaS Pro</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Próximo cobro: 15 Mar 2026</p>
                                    </div>
                                </div>
                                <button className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">Gestionar</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="bg-white rounded-[40px] border border-slate-200 p-8 md:p-12 shadow-xl space-y-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Notificaciones Automáticas</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Recordatorios de Cobranza e IA</p>
                                </div>
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <Bell className="w-6 h-6" />
                                </div>
                            </div>

                            {/* New Explanation Banner */}
                            <div className="p-6 bg-slate-900 rounded-[32px] text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                    <Sparkles className="w-24 h-24 text-indigo-400" />
                                </div>
                                <div className="relative z-10 space-y-3">
                                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">Estrategia Inteligente</p>
                                    <h4 className="text-lg font-black tracking-tight">Comunicación Premium Automática</h4>
                                    <p className="text-xs text-slate-300 leading-relaxed font-medium max-w-2xl">
                                        Elige el estilo que más se apegue a tu personalidad. El sistema enviará avisos automáticos siguiendo este estilo,
                                        rotando variaciones inteligentes para evitar bloqueos en WhatsApp. Todos los mensajes incluyen la opción de baja
                                        para el cliente y son redactados por nuestro cerebro de IA.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-12">
                                {/* Pre-due Notification */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs">01</div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Aviso Preventivo</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enviado antes del vencimiento</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={notificationSettings.pre_due.enabled}
                                                onChange={(e) => setNotificationSettings({
                                                    ...notificationSettings,
                                                    pre_due: { ...notificationSettings.pre_due, enabled: e.target.checked }
                                                })}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                        </label>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enviar</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="30"
                                                    value={notificationSettings.pre_due.days_before}
                                                    onChange={(e) => setNotificationSettings({
                                                        ...notificationSettings,
                                                        pre_due: { ...notificationSettings.pre_due, days_before: parseInt(e.target.value) || 1 }
                                                    })}
                                                    className="w-16 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500"
                                                />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">días antes</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tono de la IA</label>
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    { id: 'amistoso', label: 'Amistoso', example: '¡Hola! {{nombre_cliente}}, espero estés de maravilla...' },
                                                    { id: 'profesional', label: 'Profesional', example: 'Estimado/a {{nombre_cliente}}, le informamos que...' },
                                                    { id: 'directo', label: 'Directo', example: 'Recordatorio: Póliza {{póliza}} vence el {{vencimiento}}.' },
                                                    { id: 'urgente', label: 'Urgente', example: '¡IMPORTANTE! Evite la cancelación de su protección...' }
                                                ].map(tone => (
                                                    <div key={tone.id} className="flex flex-col gap-1">
                                                        <button
                                                            onClick={async () => {
                                                                setNotificationSettings({
                                                                    ...notificationSettings,
                                                                    pre_due: {
                                                                        ...notificationSettings.pre_due,
                                                                        ai_tone: tone.id,
                                                                        variants: INSTANT_TEMPLATES.pre_due[tone.id] || ["", "", ""]
                                                                    }
                                                                });
                                                            }}
                                                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${notificationSettings.pre_due.ai_tone === tone.id
                                                                ? 'bg-slate-900 text-white'
                                                                : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-400'
                                                                }`}
                                                        >
                                                            {tone.label}
                                                        </button>
                                                        {notificationSettings.pre_due.ai_tone === tone.id && (
                                                            <p className="text-[9px] text-slate-400 italic font-medium max-w-[120px] leading-tight mt-1">"{tone.example}"</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                {[0, 1, 2].map((idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setNotificationSettings({
                                                            ...notificationSettings,
                                                            pre_due: { ...notificationSettings.pre_due, currentVariant: idx }
                                                        })}
                                                        className={cn(
                                                            "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all",
                                                            (notificationSettings.pre_due.currentVariant || 0) === idx
                                                                ? "bg-emerald-100 border-emerald-200 text-emerald-700"
                                                                : "bg-white border-slate-100 text-slate-400"
                                                        )}
                                                    >
                                                        Variante {idx + 1}
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                value={notificationSettings.pre_due.variants[notificationSettings.pre_due.currentVariant || 0] || ""}
                                                onChange={(e) => {
                                                    const newVariants = [...notificationSettings.pre_due.variants];
                                                    newVariants[notificationSettings.pre_due.currentVariant || 0] = e.target.value;
                                                    setNotificationSettings({
                                                        ...notificationSettings,
                                                        pre_due: { ...notificationSettings.pre_due, variants: newVariants }
                                                    })
                                                }}
                                                className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                                                placeholder="Escribe tu mensaje aquí..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Grace Period Notification */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xs">02</div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Periodo de Gracia</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enviado después del vencimiento</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={notificationSettings.grace_period.enabled}
                                                onChange={(e) => setNotificationSettings({
                                                    ...notificationSettings,
                                                    grace_period: { ...notificationSettings.grace_period, enabled: e.target.checked }
                                                })}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                        </label>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enviar</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="30"
                                                    value={notificationSettings.grace_period.days_after}
                                                    onChange={(e) => setNotificationSettings({
                                                        ...notificationSettings,
                                                        grace_period: { ...notificationSettings.grace_period, days_after: parseInt(e.target.value) || 1 }
                                                    })}
                                                    className="w-16 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 outline-none focus:ring-1 focus:ring-amber-500"
                                                />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">días después</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tono de la IA</label>
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    { id: 'amistoso', label: 'Amistoso', example: '¡Hola! {{nombre_cliente}}, espero estés de maravilla...' },
                                                    { id: 'profesional', label: 'Profesional', example: 'Estimado/a {{nombre_cliente}}, le informamos que...' },
                                                    { id: 'directo', label: 'Directo', example: 'Recordatorio: Póliza {{póliza}} vence el {{vencimiento}}.' },
                                                    { id: 'urgente', label: 'Urgente', example: '¡IMPORTANTE! Evite la cancelación de su protección...' }
                                                ].map(tone => (
                                                    <div key={tone.id} className="flex flex-col gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setNotificationSettings({
                                                                    ...notificationSettings,
                                                                    grace_period: {
                                                                        ...notificationSettings.grace_period,
                                                                        ai_tone: tone.id,
                                                                        variants: INSTANT_TEMPLATES.grace_period[tone.id] || ["", "", ""]
                                                                    }
                                                                })
                                                            }}
                                                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${notificationSettings.grace_period.ai_tone === tone.id
                                                                ? 'bg-slate-900 text-white'
                                                                : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-400'
                                                                }`}
                                                        >
                                                            {tone.label}
                                                        </button>
                                                        {notificationSettings.grace_period.ai_tone === tone.id && (
                                                            <p className="text-[9px] text-slate-400 italic font-medium max-w-[120px] leading-tight mt-1">"{tone.example}"</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                {[0, 1, 2].map((idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setNotificationSettings({
                                                            ...notificationSettings,
                                                            grace_period: { ...notificationSettings.grace_period, currentVariant: idx }
                                                        })}
                                                        className={cn(
                                                            "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all",
                                                            (notificationSettings.grace_period.currentVariant || 0) === idx
                                                                ? "bg-amber-100 border-amber-200 text-amber-700"
                                                                : "bg-white border-slate-100 text-slate-400"
                                                        )}
                                                    >
                                                        Variante {idx + 1}
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                value={notificationSettings.grace_period.variants[notificationSettings.grace_period.currentVariant || 0] || ""}
                                                onChange={(e) => {
                                                    const newVariants = [...notificationSettings.grace_period.variants];
                                                    newVariants[notificationSettings.grace_period.currentVariant || 0] = e.target.value;
                                                    setNotificationSettings({
                                                        ...notificationSettings,
                                                        grace_period: { ...notificationSettings.grace_period, variants: newVariants }
                                                    })
                                                }}
                                                className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
                                                placeholder="Escribe tu mensaje aquí..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Expired Notification */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-black text-xs">03</div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Vencida (Cancelación)</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Finalización de gracia sin pago</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={notificationSettings.expired?.enabled}
                                                onChange={(e) => setNotificationSettings({
                                                    ...notificationSettings,
                                                    expired: { ...notificationSettings.expired, enabled: e.target.checked }
                                                })}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                                        </label>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enviar</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={notificationSettings.expired?.days_after || 5}
                                                    onChange={(e) => setNotificationSettings({
                                                        ...notificationSettings,
                                                        expired: { ...notificationSettings.expired, days_after: parseInt(e.target.value) || 1 }
                                                    })}
                                                    className="w-16 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 outline-none focus:ring-1 focus:ring-rose-500"
                                                />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">días post-gracia</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tono de la IA</label>
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    { id: 'amistoso', label: 'Amistoso', example: '¡Hola! {{nombre_cliente}}, espero estés de maravilla...' },
                                                    { id: 'profesional', label: 'Profesional', example: 'Estimado/a {{nombre_cliente}}, le informamos que...' },
                                                    { id: 'directo', label: 'Directo', example: 'Recordatorio: Póliza {{póliza}} vence el {{vencimiento}}.' },
                                                    { id: 'urgente', label: 'Urgente', example: '¡IMPORTANTE! Evite la cancelación de su protección...' }
                                                ].map(tone => (
                                                    <div key={tone.id} className="flex flex-col gap-1">
                                                        <button
                                                            onClick={async () => {
                                                                setNotificationSettings({
                                                                    ...notificationSettings,
                                                                    expired: {
                                                                        ...notificationSettings.expired,
                                                                        ai_tone: tone.id,
                                                                        variants: INSTANT_TEMPLATES.expired[tone.id] || ["", "", ""]
                                                                    }
                                                                });
                                                            }}
                                                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${notificationSettings.expired?.ai_tone === tone.id
                                                                ? 'bg-slate-900 text-white'
                                                                : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-400'
                                                                }`}
                                                        >
                                                            {tone.label}
                                                        </button>
                                                        {notificationSettings.expired?.ai_tone === tone.id && (
                                                            <p className="text-[9px] text-slate-400 italic font-medium max-w-[120px] leading-tight mt-1">"{tone.example}"</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                {[0, 1, 2].map((idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setNotificationSettings({
                                                            ...notificationSettings,
                                                            expired: { ...notificationSettings.expired, currentVariant: idx }
                                                        })}
                                                        className={cn(
                                                            "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all",
                                                            (notificationSettings.expired?.currentVariant || 0) === idx
                                                                ? "bg-rose-100 border-rose-200 text-rose-700"
                                                                : "bg-white border-slate-100 text-slate-400"
                                                        )}
                                                    >
                                                        Variante {idx + 1}
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                value={notificationSettings.expired?.variants[notificationSettings.expired?.currentVariant || 0] || ""}
                                                onChange={(e) => {
                                                    const newVariants = [...(notificationSettings.expired?.variants || ["", "", ""])];
                                                    newVariants[notificationSettings.expired?.currentVariant || 0] = e.target.value;
                                                    setNotificationSettings({
                                                        ...notificationSettings,
                                                        expired: { ...notificationSettings.expired, variants: newVariants }
                                                    })
                                                }}
                                                className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-rose-500 transition-all resize-none"
                                                placeholder="Escribe tu mensaje aquí..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Etiquetas Disponibles</p>
                                <div className="flex flex-wrap gap-2">
                                    {['{{nombre_cliente}}', '{{póliza}}', '{{aseguradora}}', '{{monto}}', '{{vencimiento}}', '{{fecha_limite}}', '{{número_recibo}}', '{{moneda}}', '{{ramo}}', '{{descripción}}'].map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-mono text-indigo-600 font-bold">{tag}</span>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={saveNotificationSettings}
                                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl"
                            >
                                Guardar Reglas de Automatización
                            </button>
                        </div>
                    )}
                    {activeTab === 'security' && (
                        <div className="bg-white rounded-[40px] border border-slate-200 p-8 md:p-12 shadow-xl text-center">
                            <Shield className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-900 uppercase">Seguridad Avanzada</h3>
                            <p className="text-sm text-slate-400 mt-2">La gestión de contraseñas llegará en la versión 34.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Icons placeholders for the fixed code
