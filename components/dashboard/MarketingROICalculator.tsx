
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calculator, DollarSign, Target, TrendingUp, Info, ArrowRight } from "lucide-react"

export default function MarketingROICalculator() {
    const [investment, setInvestment] = useState(5000)
    const [cpl, setCpl] = useState(100)
    const [closingRate, setClosingRate] = useState(10) // 10%
    const [avgCommission, setAvgCommission] = useState(2500)

    const leads = Math.floor(investment / cpl)
    const expectedSales = Math.floor(leads * (closingRate / 100))
    const totalRevenue = expectedSales * avgCommission
    const roi = investment > 0 ? ((totalRevenue - investment) / investment * 100) : 0
    const breakevenSales = Math.ceil(investment / avgCommission)

    return (
        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200/50 shadow-inner group">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                    <Calculator className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase">Simulador de ROI & Punto de Equilibrio</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calcula tu 'Money Machine'</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Inputs */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                            Inversión Mensual <span>${investment.toLocaleString()}</span>
                        </label>
                        <input 
                            type="range" min="1000" max="50000" step="500"
                            value={investment} onChange={(e) => setInvestment(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                            Costo por Lead (CPL) <span>${cpl}</span>
                        </label>
                        <input 
                            type="range" min="50" max="500" step="10"
                            value={cpl} onChange={(e) => setCpl(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                            Tasa de Cierre <span>{closingRate}%</span>
                        </label>
                        <input 
                            type="range" min="1" max="50" step="1"
                            value={closingRate} onChange={(e) => setClosingRate(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                    </div>
                </div>

                {/* Results Card */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-12 transition-transform">
                        <TrendingUp className="w-24 h-24 text-slate-900" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Leads Estimados</p>
                            <p className="text-2xl font-black text-slate-900">{leads}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ventas Esperadas</p>
                            <p className="text-2xl font-black text-indigo-600">{expectedSales}</p>
                        </div>
                    </div>

                    <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Retorno de Inversión (ROI)</p>
                            <span className="text-xs font-black text-emerald-600">+{Math.round(roi)}%</span>
                        </div>
                        <p className="text-3xl font-black text-emerald-900">${totalRevenue.toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-2xl text-white">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                            <Target className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Punto de Equilibrio</p>
                            <p className="text-xs font-bold">Necesitas vender <span className="text-amber-400">{breakevenSales} pólizas</span> para recuperar tu inversión.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <Info className="w-3 h-3" />
                <span>Cifras estimadas basadas en promedios del mercado de seguros 2026.</span>
            </div>
        </div>
    )
}
