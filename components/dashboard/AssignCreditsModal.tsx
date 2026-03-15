"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Coins, Zap, ShieldCheck, X, Loader2, Sparkles, AlertCircle } from "lucide-react"

interface AssignCreditsModalProps {
  agent: any
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AssignCreditsModal({ agent, isOpen, onClose, onSuccess }: AssignCreditsModalProps) {
  const [amount, setAmount] = useState<number>(50)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAssign = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/enterprise/assign-credits', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await (window as any).supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          agentId: agent.id,
          amount,
          notes
        })
      })
      const data = await res.json()
      if (data.success) {
        onSuccess()
        onClose()
      } else {
        setError(data.error || "Error al asignar créditos")
      }
    } catch (e: any) {
      setError(e.message || "Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 bg-indigo-600 text-white relative">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                  <Coins className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Asignar Créditos</h3>
                  <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">{agent.first_name} {agent.last_name}</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Amount Selection */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cantidad de Créditos</label>
                <div className="grid grid-cols-3 gap-3">
                  {[50, 100, 500].map(val => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`py-3 rounded-2xl border-2 font-black transition-all ${
                        amount === val 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                          : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value))}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-black focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none transition-all"
                  placeholder="Otra cantidad..."
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Notas / Concepto</label>
                <input 
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none transition-all"
                  placeholder="Ej: Venta de paquete 50 créditos..."
                />
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-[10px] font-bold uppercase">{error}</p>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleAssign}
                disabled={loading || amount <= 0}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <>
                        <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                        Inyectar Créditos
                    </>
                )}
              </button>

              <p className="text-[9px] text-slate-400 font-medium text-center uppercase tracking-widest flex items-center justify-center gap-1.5 opacity-60">
                <ShieldCheck className="w-3 h-3" /> Transacción Encriptada & tRAZABLE
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
