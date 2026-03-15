"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Car, Heart, Home, Award, Battery, BatteryLow, BatteryMedium, BatteryFull } from 'lucide-react'

interface ProtectionItem {
    name: string
    icon: any
    status: 'covered' | 'uncovered'
}

interface ClientProtectionMapProps {
    policies: any[]
}

export default function ClientProtectionMap({ policies = [] }: ClientProtectionMapProps) {
    const hasCoveredLine = (keywords: string[]) => {
        return policies.some((p: any) => {
            const name = (p.insurance_lines?.name || '').toUpperCase()
            const category = (p.insurance_lines?.category || '').toUpperCase()
            return keywords.some(k => name.includes(k) || category.includes(k))
        })
    }

    const lines: ProtectionItem[] = [
        { name: 'Autos', icon: Car, status: hasCoveredLine(['AUTO', 'VEHICULO', 'CAMION']) ? 'covered' : 'uncovered' },
        { name: 'GMM', icon: Heart, status: hasCoveredLine(['MEDIC', 'SALUD', 'GMM', 'HOSPITAL']) ? 'covered' : 'uncovered' },
        { name: 'Vida', icon: Award, status: hasCoveredLine(['VIDA', 'ACCIDENTE', 'RETIRO']) ? 'covered' : 'uncovered' },
        { name: 'Hogar', icon: Home, status: hasCoveredLine(['HOGAR', 'CASA', 'INMUEBLE', 'INCENDIO']) ? 'covered' : 'uncovered' }
    ]

    const coveredCount = lines.filter(l => l.status === 'covered').length
    const protectionPercentage = (coveredCount / lines.length) * 100

    return (
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white overflow-hidden relative shadow-2xl">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                             Blindaje Patrimonial
                            <Shield className="w-5 h-5 text-emerald-400" />
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status Actual del Cliente</p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-black text-emerald-400">{protectionPercentage}%</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protegido</p>
                    </div>
                </div>

                {/* Battery Visual */}
                <div className="relative h-24 bg-slate-800 rounded-3xl p-4 flex items-center justify-between border border-slate-700 shadow-inner group">
                    {/* Battery Fill */}
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${protectionPercentage}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={`absolute left-0 top-0 bottom-0 rounded-l-3xl rounded-r-xl opacity-20 ${
                            protectionPercentage <= 25 ? 'bg-rose-500' :
                            protectionPercentage <= 50 ? 'bg-amber-500' :
                            'bg-emerald-500'
                        }`}
                    />
                    
                    {/* Battery Pin (Small Cap) */}
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-2 h-8 bg-slate-800 rounded-r-lg border-y border-r border-slate-700" />

                    <div className="grid grid-cols-4 w-full relative z-10 gap-2">
                        {lines.map((line, idx) => (
                            <div key={idx} className="flex flex-col items-center justify-center p-2 rounded-2xl transition-all group-hover:scale-105">
                                <div className={`p-2 rounded-xl mb-1.5 transition-all ${
                                    line.status === 'covered' 
                                    ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                                    : 'bg-slate-700/50 text-slate-500 grayscale'
                                }`}>
                                    <line.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-tighter ${
                                    line.status === 'covered' ? 'text-white' : 'text-slate-600'
                                }`}>
                                    {line.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${
                            protectionPercentage < 50 ? 'bg-rose-500' : 'bg-emerald-500'
                        }`} />
                        <p className="text-[11px] font-medium text-slate-300 leading-relaxed italic">
                            {protectionPercentage === 100 
                                ? "Blindaje Total: Tu patrimonio está 100% protegido con RB Proyectos." 
                                : protectionPercentage >= 50 
                                ? "Protección Parcial: Recomendamos blindar los ramos faltantes para mayor seguridad."
                                : "Nivel Crítico: Tienes huecos graves en tu seguridad patrimonial. ¡A actuar hoy!"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Micro Interaction Hint */}
            <div className="absolute bottom-2 right-8 opacity-20 transform -rotate-12">
                <BatteryFull className="w-12 h-12 text-slate-500" />
            </div>
        </div>
    )
}
