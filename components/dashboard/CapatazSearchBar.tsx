"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Command, X, Shield, Sparkles, ChevronRight, Calculator, PieChart, Users, FileText, Magnet, Car } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface SearchResult {
    id: string;
    title: string;
    description: string;
    category: 'function' | 'client' | 'policy' | 'prospect';
    href: string;
    icon: any;
}

export default function CapatazSearchBar() {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [dbResults, setDbResults] = useState<SearchResult[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const staticFunctions: SearchResult[] = [
        { id: 'f1', title: 'Nueva Póliza', description: 'Registrar póliza', category: 'function', href: '/dashboard/policies?action=new', icon: Shield },
        { id: 'f2', title: 'Reportar Siniestro', description: 'Inicio Reclamación IA', category: 'function', href: '/dashboard/claims?action=report', icon: Sparkles },
        { id: 'f3', title: 'Consola Commander', description: 'Visión 360', category: 'function', href: '/dashboard/enterprise', icon: Command },
    ];

    const performUniversalSearch = useCallback(async (searchTerm: string) => {
        if (!searchTerm || searchTerm.length < 2) {
            setDbResults([]);
            return;
        }

        setIsLoading(true);
        const results: SearchResult[] = [];

        try {
            // 1. Buscar en Clientes (Nombres, Correo)
            const { data: clients } = await supabase
                .from('clients')
                .select('id, first_name, last_name, email')
                .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
                .limit(3);

            if (clients) {
                clients.forEach(c => {
                    results.push({
                        id: `cl-${c.id}`,
                        title: `${c.first_name} ${c.last_name}`,
                        description: `Cliente • ${c.email || 'Sin correo'}`,
                        category: 'client',
                        href: `/dashboard/clients?id=${c.id}`,
                        icon: Users
                    });
                });
            }

            // 2. Buscar en Pólizas (Número, Placas, Modelo de Auto en policy_data, y NOTAS)
            const { data: policies } = await supabase
                .from('policies')
                .select('id, policy_number, status, policy_data, notes')
                .or(`policy_number.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%,policy_data->>'version'.ilike.%${searchTerm}%,policy_data->>'plates'.ilike.%${searchTerm}%,policy_data->>'model'.ilike.%${searchTerm}%,policy_data->>'brand'.ilike.%${searchTerm}%`)
                .limit(5);

            if (policies) {
                policies.forEach(p => {
                    const carInfo = (p.policy_data as any)?.model || (p.policy_data as any)?.brand || (p.policy_data as any)?.version || "Póliza";
                    const plates = (p.policy_data as any)?.plates ? ` • Placas: ${(p.policy_data as any).plates}` : "";
                    const fromNote = p.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ? " (Encontrado en notas)" : "";
                    
                    results.push({
                        id: `po-${p.id}`,
                        title: `${carInfo}${fromNote}`,
                        description: `Nº ${p.policy_number}${plates}`,
                        category: 'policy',
                        href: `/dashboard/policies?id=${p.id}`,
                        icon: p.policy_data ? Car : FileText
                    });
                });
            }

            setDbResults(results);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) performUniversalSearch(query);
        }, 400); // Ligeramente más lento para evitar saturar DB
        return () => clearTimeout(timer);
    }, [query, performUniversalSearch]);

    const combinedResults = [
        ...staticFunctions.filter(f => f.title.toLowerCase().includes(query.toLowerCase())),
        ...dbResults
    ];

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setIsOpen((open) => !open)
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const handleSelect = (href: string) => {
        setIsOpen(false)
        setQuery("")
        router.push(href)
    }

    return (
        <div className="w-full relative px-4 mt-4">
            {/* Search Input Container */}
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <Search className={cn("w-4 h-4 transition-all duration-300", 
                        isLoading ? "text-emerald-400 animate-pulse scale-110" : "text-slate-500 group-focus-within:text-emerald-400"
                    )} />
                </div>
                <input 
                    type="text"
                    placeholder="Buscador Inteligente (Placas, Cliente, Modelo...)"
                    className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl pl-11 pr-4 py-3 text-[11px] font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/40 transition-all shadow-2xl"
                    onFocus={() => setIsOpen(true)}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:block">
                    <kbd className="text-[8px] font-black bg-slate-950/50 border border-slate-800 px-1.5 py-0.5 rounded-md text-slate-500 opacity-60">⌘K</kbd>
                </div>
            </div>

            {/* Results Dropdown */}
            <AnimatePresence>
                {isOpen && (query.length > 0 || combinedResults.length > 0) && (
                    <div className="relative">
                        <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
                        
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute top-2 left-0 right-0 z-[110] bg-white rounded-3xl shadow-[0_20px_70px_-15px_rgba(0,0,0,0.3)] border border-slate-200 overflow-hidden flex flex-col"
                        >
                            <div className="p-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {combinedResults.length > 0 ? (
                                    <div className="p-1 space-y-0.5">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] pl-4 py-3">Resultados sugeridos</p>
                                        {combinedResults.map((result) => (
                                            <button
                                                key={result.id}
                                                onClick={() => handleSelect(result.href)}
                                                className="w-full p-2.5 flex items-center gap-3 hover:bg-slate-50 rounded-2xl transition-all group border border-transparent hover:border-slate-100/50"
                                            >
                                                <div className="bg-slate-50 p-2 rounded-xl group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all text-slate-400 border border-slate-100 shrink-0">
                                                    <result.icon className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex-1 text-left min-w-0">
                                                    <p className="text-[11px] font-black text-slate-900 truncate tracking-tight">{result.title}</p>
                                                    <p className="text-[9px] text-slate-400 font-medium truncate">{result.description}</p>
                                                </div>
                                                <ChevronRight className="w-3 h-3 text-slate-200 group-hover:text-emerald-400 transition-all shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                ) : query.length > 1 && !isLoading ? (
                                    <div className="py-10 text-center bg-slate-50/50">
                                        <Magnet className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No hay coincidencias para "{query}"</p>
                                    </div>
                                ) : null}
                            </div>

                            <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between px-5">
                                <Link href="/dashboard" className="text-[8px] font-black text-emerald-500 uppercase tracking-widest hover:underline">
                                    Motor de IA Capataz
                                </Link>
                                {isLoading && <div className="w-3 h-3 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />}
                                <button onClick={() => setIsOpen(false)} className="text-[9px] font-bold text-slate-400 hover:text-slate-600">Cerrar</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

import Link from "next/link"
