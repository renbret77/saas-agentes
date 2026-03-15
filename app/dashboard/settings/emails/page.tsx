"use client"

import { useState, useEffect } from "react"
import { Shield, Save, Mail, Server, Lock, CheckCircle2, Loader2, Info, Zap } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function EmailSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [loadingTest, setLoadingTest] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [config, setConfig] = useState({
        host: "",
        port: 587,
        username: "",
        password_encrypted: "",
        from_name: "",
        from_email: "",
        use_privacy_notice: true,
        custom_privacy_notice: ""
    })

    useEffect(() => {
        fetchConfig()
    }, [])

    const fetchConfig = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('communication_configs')
            .select('*')
            .eq('agent_id', user.id)
            .single()

        if (data) {
            setConfig(data)
        }
        setLoading(false)
    }

    const handleSave = async () => {
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('communication_configs')
            .upsert({
                agent_id: user.id,
                ...config,
                updated_at: new Date().toISOString()
            })

        if (error) {
            alert("Error al guardar la configuración: " + error.message)
        } else {
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        }
        setSaving(false)
    }

    if (loading) return (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
    )

    return (
        <div className="max-w-4xl mx-auto space-y-10 p-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                        <Mail className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Configuración de Correo</h1>
                        <p className="text-slate-500 text-sm font-bold tracking-widest uppercase">Conecta tu servidor SMTP y personaliza tus envíos.</p>
                    </div>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl 
                        ${saved ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-indigo-600 text-white hover:bg-black hover:scale-105 active:scale-95 shadow-indigo-100'}`}
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saving ? "Guardando..." : saved ? "Configuración Guardada" : "Guardar Ajustes"}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SMTP Credentials */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <Server className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Servidor de Salida (SMTP)</h2>
                        </div>
                        <button 
                            onClick={async () => {
                                if (!config.host || !config.username || !config.password_encrypted) {
                                    alert("Por favor llena los datos antes de probar.");
                                    return;
                                }
                                setLoadingTest(true);
                                try {
                                    const res = await fetch('/api/communications/test-connection', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            host: config.host,
                                            port: config.port,
                                            username: config.username,
                                            password: config.password_encrypted
                                        })
                                    });
                                    const data = await res.json();
                                    if (data.success) alert("✅ ¡Conexión exitosa!");
                                    else alert("❌ Error: " + data.error);
                                } catch (e) {
                                    alert("❌ Error de red al probar conexión.");
                                } finally {
                                    setLoadingTest(false);
                                }
                            }}
                            disabled={loadingTest}
                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors flex items-center gap-2"
                        >
                            {loadingTest ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 fill-current" />}
                            Probar Conexión
                        </button>
                    </div>

                    {/* Presets Quick Action */}
                    <div className="flex flex-wrap gap-2 pt-2">
                        <button 
                            onClick={() => setConfig({
                                ...config,
                                host: 'smtp.office365.com',
                                port: 587,
                                from_name: config.from_name || 'Agente Seguros'
                            })}
                            className="px-4 py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 uppercase transition-all flex items-center gap-2"
                        >
                            <span className="w-2 h-2 bg-blue-500 rounded-full" /> Microsoft 365
                        </button>
                        <button 
                            onClick={() => setConfig({
                                ...config,
                                host: 'smtp.gmail.com',
                                port: 587,
                                from_name: config.from_name || 'Agente Seguros'
                            })}
                            className="px-4 py-2 bg-slate-50 hover:bg-emerald-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 uppercase transition-all flex items-center gap-2"
                        >
                            <span className="w-2 h-2 bg-emerald-500 rounded-full" /> Gmail / Google
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Host del Servidor</label>
                                <a 
                                    href="https://mysignins.microsoft.com/security-info" 
                                    target="_blank" 
                                    className="text-[9px] font-bold text-indigo-500 hover:underline flex items-center gap-1"
                                >
                                    <Info className="w-2.5 h-2.5" /> ¿Necesitas Password de App?
                                </a>
                            </div>
                            <input 
                                type="text" 
                                value={config.host}
                                onChange={(e) => setConfig({...config, host: e.target.value})}
                                placeholder="smtp.ejemplo.com"
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Puerto</label>
                                <input 
                                    type="number" 
                                    value={config.port}
                                    onChange={(e) => setConfig({...config, port: parseInt(e.target.value)})}
                                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Correo Electrónico (Usuario)</label>
                                <input 
                                    type="text" 
                                    value={config.username}
                                    onChange={(e) => setConfig({...config, username: e.target.value})}
                                    placeholder="tu@correo.com"
                                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Contraseña</label>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    value={config.password_encrypted}
                                    onChange={(e) => setConfig({...config, password_encrypted: e.target.value})}
                                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                />
                                <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Identity & Legal */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-5 h-5 text-emerald-500" />
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Identidad y Legalidad</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Nombre del Remitente</label>
                            <input 
                                type="text" 
                                value={config.from_name}
                                onChange={(e) => setConfig({...config, from_name: e.target.value})}
                                placeholder="Tu Nombre o Empresa"
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Email de Salida</label>
                            <input 
                                type="email" 
                                value={config.from_email}
                                onChange={(e) => setConfig({...config, from_email: e.target.value})}
                                placeholder="notificaciones@tudominio.com"
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-50">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-12 h-6 rounded-full transition-all relative ${config.use_privacy_notice ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                    <input 
                                        type="checkbox" 
                                        className="hidden" 
                                        checked={config.use_privacy_notice}
                                        onChange={(e) => setConfig({...config, use_privacy_notice: e.target.checked})}
                                    />
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.use_privacy_notice ? 'left-7' : 'left-1'}`} />
                                </div>
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1 group-hover:text-indigo-600 transition-all">Incluir Aviso de Privacidad</span>
                            </label>

                            {config.use_privacy_notice && (
                                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Personalizar Aviso (Opcional)</label>
                                    <textarea 
                                        value={config.custom_privacy_notice}
                                        onChange={(e) => setConfig({...config, custom_privacy_notice: e.target.value})}
                                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-[11px] font-medium text-slate-500 focus:ring-2 focus:ring-indigo-500/10 transition-all min-h-[120px]"
                                        placeholder="Deja vacío para usar el aviso estándar profesional..."
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 flex items-start gap-4">
                <Info className="w-5 h-5 text-indigo-500 mt-1" />
                <div className="space-y-1">
                    <p className="text-xs font-black text-indigo-900 uppercase">¿Por qué configurar esto?</p>
                    <p className="text-xs font-medium text-indigo-700/80 leading-relaxed">
                        Al configurar tu propio servidor SMTP, los correos saldrán desde tu dominio oficial, mejorando la confianza del asegurado y permitiéndonos rastrear si han sido abiertos o clickeados.
                    </p>
                </div>
            </div>
        </div>
    )
}
