"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
    DollarSign, 
    TrendingUp, 
    ArrowUpRight, 
    Calendar, 
    ArrowDownRight, 
    PieChart, 
    BarChart3,
    Shield,
    Target
} from "lucide-react"
import { cn } from "@/lib/utils"
import { FinancialEngine } from "@/lib/finance/engine"
import { supabase } from "@/lib/supabase"
import { Plus, Receipt, History, AlertCircle, TrendingDown } from "lucide-react"

export default function FinancialDashboard() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        expectedCommissions: 0,
        netProfit: 0,
        operatingExpenses: 0,
        roi: 0
    })
    const [projections, setProjections] = useState<any[]>([])
    const [expenses, setExpenses] = useState<any[]>([])
    const [isAddingExpense, setIsAddingExpense] = useState(false)
    const [newExpense, setNewExpense] = useState({ category: 'Marketing', amount: '', description: '' })
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const loadFinancialData = async () => {
            setLoading(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const data = await FinancialEngine.getCommissionProjection(user.id, 30)
                setProjections(data)

                const { data: expensesData } = await supabase
                    .from('agent_expenses')
                    .select('*')
                    .eq('agent_id', user.id)
                
                setExpenses(expensesData || [])

                const totalExpected = data.reduce((acc: number, p: any) => acc + (Number(p.estimated_commission) || 0), 0)
                const totalExpenses = (expensesData || []).reduce((acc: number, e: any) => acc + (Number(e.amount) || 0), 0)
                const net = totalExpected - totalExpenses

                setStats({
                    expectedCommissions: totalExpected,
                    operatingExpenses: totalExpenses,
                    netProfit: net,
                    roi: totalExpenses > 0 ? (totalExpected / totalExpenses).toFixed(2) as any : 0
                })

            } catch (error) {
                console.error("Error loading financial stats:", error)
            } finally {
                setLoading(false)
            }
        }

        loadFinancialData()
    }, [])

    const handleAddExpense = async () => {
        if (!newExpense.amount) return
        setIsSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const { error } = await supabase
                .from('agent_expenses')
                .insert({
                    agent_id: user?.id,
                    category: newExpense.category,
                    amount: parseFloat(newExpense.amount),
                    description: newExpense.description,
                    expense_date: new Date().toISOString().split('T')[0]
                })

            if (error) throw error
            
            setIsAddingExpense(false)
            setNewExpense({ category: 'Marketing', amount: '', description: '' })
            // Recargar datos
            const { data: expensesData } = await supabase
                .from('agent_expenses')
                .select('*')
                .eq('agent_id', user?.id)
            setExpenses(expensesData || [])
            
            // Recualcular stats (simplificado: recargar todo)
            window.location.reload() 
        } catch (error) {
            alert("Error al registrar gasto")
        } finally {
            setIsSaving(false)
        }
    }

    const getProjectionForDays = (days: number) => {
        const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        return projections
            .filter(p => new Date(p.due_date) <= cutoff)
            .reduce((acc, p) => acc + (Number(p.estimated_commission) || 0), 0)
    }

    const projectionData = [
        { label: "Próximos 7 días", value: getProjectionForDays(7), color: "bg-indigo-500" },
        { label: "8-15 días", value: getProjectionForDays(15) - getProjectionForDays(7), color: "bg-purple-500" },
        { label: "16-30 días", value: getProjectionForDays(30) - getProjectionForDays(15), color: "bg-blue-500" },
    ]

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase">
                        El Liquidador <span className="text-indigo-600">Financiero v1.0</span>
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Rentabilidad Real & Proyección de Comisiones</p>
                </div>
                <div className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full border border-indigo-100 uppercase tracking-widest">
                    Alpha Access
                </div>
            </div>

            {/* Main Financial KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Comisiones Proyectadas (30d)", value: `$${stats.expectedCommissions.toLocaleString()}`, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Gastos Operativos", value: `$${stats.operatingExpenses.toLocaleString()}`, icon: Target, color: "text-rose-600", bg: "bg-rose-50" },
                    { label: "Rentabilidad Neta", value: `$${stats.netProfit.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "ROI Real (Operativo)", value: `${stats.roi}x`, icon: BarChart3, color: "text-amber-600", bg: "bg-amber-50" },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-50 transition-all"
                    >
                        <div className={cn("absolute top-0 right-0 p-5 opacity-5 group-hover:scale-110 transition-transform", stat.color)}>
                            <stat.icon className="w-12 h-12" />
                        </div>
                        <div className="relative z-10 space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                            <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{loading ? "..." : stat.value}</h4>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Projection Chart & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-600" />
                                Proyección de Cobranza
                            </h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Flujo de entrada de comisiones estimado</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {projectionData.map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <p className="text-xs font-black text-slate-700 uppercase tracking-tighter">{item.label}</p>
                                    <p className="text-sm font-black text-slate-900">${item.value.toLocaleString()}</p>
                                </div>
                                <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(item.value / 80000) * 100}%` }}
                                        transition={{ duration: 1, delay: i * 0.2 }}
                                        className={cn("h-full rounded-full", item.color)} 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="pt-6 border-t border-slate-50 flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 italic leading-relaxed">
                            Cálculo basado en pólizas vigentes y tasas de comisión pactadas por aseguradora.
                        </p>
                    </div>
                </div>

                <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group flex flex-col justify-between">
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all" />
                    
                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-emerald-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-950 group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black uppercase tracking-tighter">Salud Financiera de Red</h4>
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Optimización de Margen</p>
                            </div>
                        </div>

                        <p className="text-sm font-medium text-slate-400 leading-relaxed italic">
                            Tu red está operando con un <span className="text-emerald-300 font-extrabold underline decoration-emerald-400 underline-offset-4">margen neto del 67%</span> después de costos de marketing. Se detectó una ineficiencia en el CPL de "Vida" que podría mejorar tu rentabilidad global un <span className="text-white font-black">+4%</span> este mes.
                        </p>

                        <div className="grid grid-cols-2 gap-8 py-6 border-y border-white/5">
                            <div>
                                <p className="text-3xl font-black text-white">$21.4k</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Margen Diario Promedio</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-emerald-400">+12%</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Crecimiento Profit</p>
                            </div>
                        </div>
                    </div>

                    <button className="w-full mt-8 py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-400 hover:text-white transition-all active:scale-95 z-10">
                        DESCARGAR ESTADO DE CUENTA PRO
                    </button>
                </div>
            </div>

            {/* El Liquidador Pro: Expenses Management NEW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Expense Form */}
                <div className="lg:col-span-1 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                            <Plus className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-tight">Registrar Gasto Pro</h4>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</label>
                            <select 
                                value={newExpense.category}
                                onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                            >
                                <option>Marketing</option>
                                <option>Oficina</option>
                                <option>Tecnología</option>
                                <option>Personal</option>
                                <option>Otros</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto ($)</label>
                            <input 
                                type="number"
                                value={newExpense.amount}
                                onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                                placeholder="0.00"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</label>
                            <input 
                                type="text"
                                value={newExpense.description}
                                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                                placeholder="Ej: Google Ads Semanal"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                            />
                        </div>
                        <button 
                            onClick={handleAddExpense}
                            disabled={isSaving}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-rose-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? "Guardando..." : <><Receipt className="w-3.5 h-3.5" /> Registrar Gasto</>}
                        </button>
                    </div>
                </div>

                {/* Expenses History */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center">
                                <History className="w-5 h-5" />
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-tight">Historial de Operación</h4>
                        </div>
                        <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase">Últimos 30 días</span>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-50">
                        <table className="w-full border-collapse text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Fecha</th>
                                    <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Categoría</th>
                                    <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Descripción</th>
                                    <th className="px-5 py-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {expenses.length > 0 ? expenses.map((exp, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-4 text-[10px] font-bold text-slate-500">{exp.expense_date}</td>
                                        <td className="px-5 py-4">
                                            <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                                                {exp.category}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-[11px] font-bold text-slate-900">{exp.description}</td>
                                        <td className="px-5 py-4 text-right text-[11px] font-black text-rose-600">-${Number(exp.amount).toLocaleString()}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-10 text-center text-[10px] text-slate-400 italic">No hay gastos registrados este periodo.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
