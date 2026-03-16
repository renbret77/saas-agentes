"use client"

import { motion } from "framer-motion"
import { CheckCircle2, Zap, ShieldCheck, ChevronDown, Sparkles, ShieldAlert, Download, Plus } from "lucide-react"
import { useState } from "react"
import { INSURANCE_TEMPLATES } from "@/lib/insurance-templates"

interface QuotePresentationProps {
    type: string
    quoteData: any
    agencyName?: string
    videoUrl?: string
}

export default function QuotePresentation({ type, quoteData, agencyName = "Tu Agente de Seguros", videoUrl }: QuotePresentationProps) {
    const template = (INSURANCE_TEMPLATES as any)[type] || INSURANCE_TEMPLATES.auto
    const [openFaq, setOpenFaq] = useState<number | null>(null)

    // Listado de Coberturas Accesorias Identificadas (Quálitas & Otros)
    const ACCESSORY_KEYWORDS = [
        "RC Complementaria", "RC Cruzada", "Remolque", "Transporte", "Robo Parcial", "CADE", 
        "Exención de Deducible", "Llantas", "Rines", "Agencia", "Sustituto", "Extensión de RC",
        "Contenidos", "Cristales", "Maternidad", "Extranjero", "Dental", "Visión", "Maniobras", "Estadía"
    ]

    // Datos para personalización Omni Elite
    const clientName = quoteData.client_name || "Estimado Cliente"
    const vehicleName = quoteData.vehicle_description || (type === 'auto' ? "tu vehículo" : "tu patrimonio")
    
    // Lógica Financiera Dinámica Avanzada (Inversa)
    const totalPremiumFromPDF = parseFloat(quoteData.premium_total?.toString().replace(/,/g, '')) || 0
    
    // Identificar qué coberturas en el PDF son "Accesorias"
    // PRICE_SAFETY_FILTER: Ignoramos precios que parezcan Sumas Aseguradas (ej. > 40% del total)
    const detectedAccessories = quoteData.coverages?.filter((cov: any) => {
        const isAccessory = ACCESSORY_KEYWORDS.some(key => cov.name.toLowerCase().includes(key.toLowerCase()))
        const price = parseFloat(cov.price?.toString() || "0")
        const premium = totalPremiumFromPDF || 1
        return isAccessory && price < (premium * 0.4) // Si es > 40%, probablemente es suma asegurada
    }) || []

    const accessoriesSum = detectedAccessories.reduce((acc: number, cov: any) => acc + (parseFloat(cov.price?.toString() || "0")), 0)
    
    // El precio base es Total - Accesorios
    const basePrice = Math.max(0, totalPremiumFromPDF - accessoriesSum)
    
    // Tarifa Original (Simulada para mostrar el valor del descuento si no viene en el PDF)
    const originalTariff = basePrice / 0.7 // Asumimos un 30% de descuento comercial "Elite"
    
    // El estado de selectedAddons inicial debe ser vacío si queremos el efecto "Upsell"
    // O podemos pre-seleccionar los detectados. Rene quiere el efecto de "armar", así que iniciamos vacío.
    const [selectedAddons, setSelectedAddons] = useState<string[]>(
        // Por defecto no seleccionamos nada para mostrar la "Amplia Básica" primero
        []
    )
    
    const addonsTotal = selectedAddons.reduce((acc, id) => {
        const addon = template.optional_coverages?.find((a: any) => a.id === id)
        // Intentar usar el precio exacto del PDF si lo detectamos, si no usar el del template
        const exactPriceFromPDF = detectedAccessories.find((da: any) => 
            da.name.toLowerCase().includes(addon?.name.toLowerCase())
        )?.price
        return acc + (exactPriceFromPDF || addon?.price || 0)
    }, 0)
    
    const totalPrice = basePrice + addonsTotal

    const toggleAddon = (id: string) => {
        setSelectedAddons(prev => 
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        )
    }

    const downloadPDF = async () => {
        try {
            const { jsPDF } = await import('jspdf')
            const doc = new jsPDF()
            
            // Header con degradado simulado
            doc.setFillColor(15, 23, 42) // Slate-900
            doc.rect(0, 0, 210, 40, 'F')
            
            doc.setFontSize(24)
            doc.setTextColor(255, 255, 255)
            doc.text("OMNI ELITE PROPOSAL", 20, 25)
            
            doc.setFontSize(10)
            doc.setTextColor(16, 185, 129) // Emerald-500
            doc.text(`VERSION v3.11 | ${new Date().toLocaleDateString('es-MX')}`, 150, 25)
            
            doc.setFontSize(14)
            doc.setTextColor(51, 65, 85) // Slate-700
            doc.text(`Propuesta para: ${clientName}`, 20, 55)
            doc.text(`Bien a proteger: ${vehicleName}`, 20, 63)
            
            // Sección Cobertura Básica
            doc.setFillColor(248, 250, 252) // Slate-50
            doc.rect(20, 75, 170, 70, 'F')
            doc.setDrawColor(226, 232, 240)
            doc.rect(20, 75, 170, 70)
            
            doc.setFontSize(12)
            doc.setTextColor(15, 23, 42)
            doc.text("INCLUIDO EN COBERTURA BÁSICA ELITE:", 30, 85)
            
            doc.setFontSize(10)
            doc.setTextColor(100, 116, 139)
            const baseItems = [
                `• Daños Materiales: ${quoteData.deductible_dmg || '5%'}`,
                `• Robo Total: ${quoteData.deductible_theft || '10%'}`,
                `• Responsabilidad Civil: AMPARADO`,
                `• Gastos Médicos Ocupantes: AMPARADO`,
                "• Asistencia Vial Premium: INCLUIDO",
                "• Gastos Legales y Defensa: INCLUIDO",
                "• Muerte del Conductor: INCLUIDO"
            ]
            
            baseItems.forEach((text, i) => {
                doc.text(text, 35, 95 + (i * 7))
            })
            
            // Precios
            let y = 160
            doc.setFontSize(12)
            doc.setTextColor(100, 116, 139)
            doc.text(`Tarifa Original (Libro): $${originalTariff.toLocaleString()} ${quoteData.currency}`, 20, y)
            y += 10
            doc.setTextColor(16, 185, 129)
            doc.text(`Descuento Omni Elite Aplicado: - $${(originalTariff - basePrice).toLocaleString()}`, 20, y)
            y += 15
            
            doc.setFontSize(16)
            doc.setTextColor(15, 23, 42)
            doc.text(`INVERSIÓN BASE ELITE: $${basePrice.toLocaleString()} ${quoteData.currency}`, 20, y)
            
            if (selectedAddons.length > 0) {
                y += 20
                doc.setFontSize(12)
                doc.text("COBERTURAS ACCESORIAS SELECCIONADAS:", 20, y)
                y += 10
                doc.setFontSize(10)
                selectedAddons.forEach(id => {
                    const addon = template.optional_coverages?.find((a: any) => a.id === id)
                    if (addon) {
                        doc.text(`+ ${addon.name}: $${addon.price.toLocaleString()}`, 30, y)
                        y += 7
                    }
                })
            }
            
            doc.setDrawColor(16, 185, 129)
            doc.setLineWidth(1)
            doc.line(20, 250, 190, 250)
            
            doc.setFontSize(22)
            doc.setTextColor(16, 185, 129)
            doc.text(`TOTAL FINAL: $${totalPrice.toLocaleString()} ${quoteData.currency}`, 20, 265)
            
            doc.setFontSize(8)
            doc.setTextColor(148, 163, 184)
            doc.text("Esta propuesta es una simulación basada en inteligencia artificial Omni Elite v3.11. Sujeta a validación final.", 20, 285)
            doc.text("By Proyectos RB | Elite Partner", 150, 285)
            
            doc.save(`OmniElite_${clientName.replace(/\s+/g, '_')}.pdf`)
        } catch (error) {
            console.error("PDF Error:", error)
            alert("Error al generar el PDF. Por favor intenta de nuevo.")
        }
    }

    const contactAgent = () => {
        const addonsList = selectedAddons.map(id => {
            const addon = template.optional_coverages?.find((a: any) => a.id === id)
            return addon?.name
        }).filter(Boolean).join(", ")

        const message = `Hola! Soy ${clientName}. Vi la propuesta Omni Elite para ${vehicleName}. Me interesa el combo con: Cobertura Básica${addonsList ? ' + ' + addonsList : ''}. El total es $${totalPrice.toLocaleString()} ${quoteData.currency}. ¿Cómo procedemos?`
        window.open(`https://wa.me/5215500000000?text=${encodeURIComponent(message)}`, '_blank')
    }

    // Select a random variety if available, otherwise use default hero
    const [heroImage] = useState(() => {
        if (template.varieties && template.varieties.length > 0) {
            return template.varieties[Math.floor(Math.random() * template.varieties.length)]
        }
        return template.hero
    })

    return (
        <div className="min-h-screen bg-white relative">
            {/* Top Watermark */}
            <div className="absolute top-4 left-4 z-50 opacity-20 pointer-events-none">
                <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">By Proyectos RB</p>
            </div>

            {/* HERO SECTION - THE WOW FACTOR */}
            <header className="relative min-h-screen flex items-center justify-center overflow-hidden">
                <img
                    src={heroImage}
                    alt={template.title}
                    className="absolute inset-0 w-full h-full object-cover scale-105 animate-pulse-slow"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/40 to-slate-900" />
                
                {/* Animated Mesh Gradient Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)] animate-mesh" />

                <div className="relative z-10 text-center px-6 max-w-5xl mx-auto space-y-12">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-2xl rounded-full border border-white/20 shadow-2xl"
                    >
                        <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Omni Elite Proposal v3.11</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    </motion.div>

                    <div className="space-y-4">
                        <motion.h1
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-4xl md:text-8xl font-black text-white tracking-tighter leading-none"
                        >
                            {clientName.split(' ')[0]}, 
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                                Blindamos tu {vehicleName.split(' ')[0]}
                            </span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg md:text-2xl text-slate-300 font-medium max-w-3xl mx-auto leading-relaxed border-l-4 border-emerald-500 pl-6"
                        >
                            {template.subtitle}
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-wrap items-center justify-center gap-6"
                    >
                        <div className="p-6 bg-white/5 backdrop-blur-xl border border-emerald-500/30 rounded-[2rem] text-left min-w-[200px] group hover:bg-white/10 transition-all shadow-lg shadow-emerald-500/10">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Inversión Omni Elite</p>
                            <p className="text-3xl font-black text-white">${totalPrice.toLocaleString()} <span className="text-xs text-slate-500">{quoteData.currency}</span></p>
                        </div>
                        <div className="hidden md:block w-px h-12 bg-white/10" />
                        <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] text-left group hover:bg-white/10 transition-all">
                            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Status Inteligencia</p>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                <p className="text-sm font-black text-white uppercase tracking-tighter">Analizado OMNI 3.0 ELITE</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="pt-12"
                    >
                        <ChevronDown className="w-8 h-8 text-white/30 mx-auto" />
                    </motion.div>
                </div>
            </header>

            {/* SECCIÓN NARRATIVA "EL DESAFÍO" (NARRATIVA PAS) */}
            <section className="py-32 px-6 bg-slate-50 relative overflow-hidden">
                <div className="max-w-4xl mx-auto space-y-20 relative z-10">
                    <div className="text-center space-y-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 font-black text-[10px] uppercase tracking-widest rounded-full"
                        >
                            <ShieldAlert className="w-3 h-3" /> Realidad del Riesgo
                        </motion.div>
                        <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter transition-all">
                            ¿Qué está en juego hoy?
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* PROBLEMA */}
                        <motion.div 
                            whileInView={{ opacity: 1, y: 0 }}
                            initial={{ opacity: 0, y: 20 }}
                            className="p-10 bg-white rounded-[3rem] shadow-xl border-b-4 border-rose-500/20"
                        >
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4">El Problema</p>
                            <p className="text-xl text-slate-600 font-medium leading-relaxed italic">"{template.story?.problem}"</p>
                        </motion.div>

                        {/* AGITACIÓN */}
                        <motion.div 
                            whileInView={{ opacity: 1, y: 0 }}
                            initial={{ opacity: 0, y: 20 }}
                            transition={{ delay: 0.1 }}
                            className="p-10 bg-slate-900 rounded-[3rem] shadow-2xl scale-105 z-20 border-b-4 border-emerald-500"
                        >
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4">La Realidad</p>
                            <p className="text-xl text-white font-black leading-tight">"{template.story?.agitate}"</p>
                        </motion.div>

                        {/* SOLUCIÓN */}
                        <motion.div 
                            whileInView={{ opacity: 1, y: 0 }}
                            initial={{ opacity: 0, y: 20 }}
                            transition={{ delay: 0.2 }}
                            className="p-10 bg-white rounded-[3rem] shadow-xl border-b-4 border-cyan-500/20"
                        >
                            <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-4">Nuestra Propuesta</p>
                            <p className="text-xl text-slate-600 font-medium leading-relaxed italic">"{template.story?.solution}"</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ARTIFICIAL INTELLIGENCE ANALYSIS SECTION (THE "OMNI BRAIN") */}
            <section className="bg-slate-900 py-32 px-6 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 font-black text-[10px] uppercase tracking-widest rounded-full border border-emerald-500/20">
                                <Zap className="w-3 h-3" /> Auditoría con OMNI 2.5 ULTRA
                            </div>
                            <h2 className="text-white text-5xl font-black tracking-tighter leading-none">
                                Por qué esta <br />
                                <span className="text-emerald-500">es tu mejor opción</span>
                            </h2>
                            <div className="h-1 w-20 bg-emerald-500" />
                        </div>
                        <div className="p-8 bg-white/5 backdrop-blur-3xl border border-emerald-500/20 rounded-[3rem] relative group">
                            <div className="absolute -top-4 -left-4 w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/40">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-xl md:text-2xl text-slate-200 font-medium italic leading-relaxed">
                                {quoteData.omni_analysis || "Estamos procesando los puntos finos de tu cobertura para garantizar el blindaje total de tu patrimonio."}
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full" />
                        <div className="relative p-12 bg-slate-800/50 backdrop-blur-2xl border border-white/10 rounded-[4rem] shadow-2xl overflow-hidden group">
                           <div className="space-y-6">
                               <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                   <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Cobertura Técnica</span>
                                   <span className="text-xs font-black text-emerald-400">OPTIMIZADA</span>
                               </div>
                               <div className="space-y-4">
                                   {quoteData.coverages?.slice(0, 5).map((cov: any, i: number) => (
                                       <div key={i} className="flex items-center justify-between group/line">
                                           <div className="flex items-center gap-3">
                                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover/line:scale-150 transition-transform" />
                                               <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{cov.name}</span>
                                           </div>
                                           <span className="text-[10px] font-black text-white bg-white/5 px-3 py-1 rounded-full">{cov.limit}</span>
                                       </div>
                                   ))}
                               </div>
                               <div className="pt-6">
                                   <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                       <motion.div 
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '98%' }}
                                            className="h-full bg-emerald-500" 
                                        />
                                   </div>
                                   <p className="text-[10px] font-black text-slate-500 mt-2 uppercase tracking-widest">Índice de Blindaje Estratégico: 98%</p>
                               </div>
                           </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* COMBO BUILDER SECTION - OMNI ELITE INTERACTIVE */}
            <section className="py-32 px-6 bg-white relative overflow-hidden" id="combo-builder">
                <div className="absolute top-0 inset-x-0 h-px bg-slate-100" />
                <div className="max-w-6xl mx-auto space-y-16">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-12">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 font-black text-[10px] uppercase tracking-widest rounded-full">
                                <Plus className="w-3 h-3" /> Configuración Elite
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">Arma tu <span className="text-indigo-600">Omni Combo</span></h2>
                            <p className="text-slate-500 text-lg font-medium">Personaliza el blindaje para tu {vehicleName} en tiempo real.</p>
                        </div>
                        <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white flex flex-col items-center justify-center min-w-[280px] shadow-2xl relative overflow-hidden group">
                             <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                             <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1 relative z-10">Inversión Final Blindada</p>
                             <div className="relative z-10 text-center">
                                <p className="text-[10px] text-slate-500 line-through mb-1">Tarifa: ${originalTariff.toLocaleString()}</p>
                                <p className="text-5xl font-black tracking-tighter">${totalPrice.toLocaleString()} <span className="text-sm font-bold opacity-50">{quoteData.currency}</span></p>
                                <div className="mt-2 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 py-1 px-3 rounded-full border border-emerald-500/20">
                                    AHORRO OMNI: ${ (originalTariff - basePrice).toLocaleString() }
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* NEW: COBERTURA BÁSICA BREAKDOWN */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        <div className="lg:col-span-4 space-y-6">
                            <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-200 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <ShieldCheck className="w-32 h-32" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Tu Cobertura Básica <br/><span className="text-emerald-600">Incluye:</span></h3>
                                <ul className="space-y-4">
                                    {[
                                        { label: "Daños Materiales", value: `Deducible ${quoteData.deductible_dmg || '5%'}` },
                                        { label: "Robo Total", value: `Deducible ${quoteData.deductible_theft || '10%'}` },
                                        { label: "Gastos Médicos", value: "Suma Protegida" },
                                        { label: "Responsabilidad Civil", value: "3-4 Millones" },
                                        { label: "Asistencia Vial", value: "Premium" },
                                        { label: "Gastos Legales", value: "Amparado" },
                                        { label: "Muerte al Conductor", value: "Incluido" }
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center justify-between text-xs border-b border-slate-200/50 pb-2">
                                            <span className="font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
                                            <span className="font-black text-slate-900">{item.value}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo Base Elite</p>
                                    <p className="text-3xl font-black text-slate-900">${basePrice.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* BASE COVERAGE CARD */}
                        <div className="p-1 group bg-slate-50 rounded-[3rem] border-2 border-slate-200 relative overflow-hidden transition-all">
                            <div className="absolute top-4 right-4 bg-emerald-500 text-white p-2 rounded-full shadow-lg z-10">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div className="h-40 overflow-hidden rounded-[2.5rem] mb-6">
                                <img src={heroImage} alt="Base" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60" />
                            </div>
                            <div className="p-6 pt-0 space-y-2">
                                <h3 className="text-xl font-black text-slate-900 leading-tight">Seguro Básico Plus</h3>
                                <p className="text-xs text-slate-500 font-medium">Cobertura amplia reglamentaria y asistencia básica.</p>
                                <div className="pt-4 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                                    INCLUIDO EN BASE
                                </div>
                            </div>
                        </div>

                        {/* OPTIONAL COMBO ADDONS */}
                        {template.optional_coverages?.map((addon: any) => (
                            <motion.button
                                key={addon.id}
                                onClick={() => toggleAddon(addon.id)}
                                whileHover={{ y: -5 }}
                                whileTap={{ scale: 0.98 }}
                                className={`p-1 rounded-[3rem] border-2 text-left transition-all relative overflow-hidden group ${selectedAddons.includes(addon.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-white border-slate-100 text-slate-900 hover:border-indigo-300 shadow-sm'}`}
                            >
                                <div className={`h-40 overflow-hidden rounded-[2.5rem] mb-6 relative`}>
                                    <img src={addon.image || heroImage} alt={addon.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    {selectedAddons.includes(addon.id) && (
                                        <div className="absolute inset-0 bg-indigo-600/40 backdrop-blur-[2px] flex items-center justify-center">
                                            <CheckCircle2 className="w-12 h-12 text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 pt-0 space-y-2">
                                    <h3 className="text-xl font-black leading-tight">{addon.name}</h3>
                                    <p className={`text-xs font-medium leading-relaxed ${selectedAddons.includes(addon.id) ? 'text-indigo-100' : 'text-slate-500'}`}>
                                        {addon.description}
                                    </p>
                                    <div className={`pt-4 font-black text-sm uppercase tracking-widest ${selectedAddons.includes(addon.id) ? 'text-white' : 'text-indigo-600'}`}>
                                        + ${addon.price.toLocaleString()}
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>
        </section>

            {/* BENEFITS SECTION - WHY US? */}
            <section className="py-32 px-6 max-w-7xl mx-auto space-y-20">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">Beneficios de tu Blindaje</h2>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto">{template.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {template.benefits.map((benefit: any, idx: number) => (
                        <motion.div
                            key={idx}
                            whileHover={{ y: -10 }}
                            className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 transition-all hover:border-emerald-500/50 group"
                        >
                            <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:bg-emerald-600 transition-colors group-hover:rotate-6 shadow-xl">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight">{benefit.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">{benefit.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* QUOTE REVEAL SECTION - THE FINANCIALS */}
            <section className="bg-slate-950 py-32 px-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-24 opacity-[0.05] pointer-events-none">
                    <Sparkles className="w-64 h-64 text-white" />
                </div>

                <div className="max-w-5xl mx-auto relative z-10 space-y-12">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 text-white font-black text-[10px] uppercase tracking-widest rounded-full border border-white/10">
                            Propuesta Económica
                        </div>
                        <h2 className="text-white text-5xl font-black tracking-tighter leading-none">Inversión Final Blindada</h2>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[4rem] p-8 md:p-16 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-48 h-48 text-white" />
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 mb-16 relative z-10">
                            <div className="space-y-2">
                                <h3 className="text-white text-4xl font-black tracking-tight">{agencyName}</h3>
                                <p className="text-slate-400 font-medium italic tracking-wide">Elegido mediante el algoritmo Omni Elite Intelligence</p>
                            </div>
                            <div className="px-10 py-8 bg-emerald-500 rounded-[2.5rem] text-center shadow-[0_20px_40px_rgba(16,185,129,0.3)]">
                                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Inversión Final Blindada</p>
                                <p className="text-5xl font-black text-white tracking-tighter">${totalPrice.toLocaleString()} <span className="text-base text-white/50">{quoteData.currency || 'MXN'}</span></p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 mb-12 relative z-10">
                            <button 
                                onClick={downloadPDF}
                                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all flex items-center gap-2 border border-white/10 group/btn"
                            >
                                <Download className="w-5 h-5 group-hover/btn:translate-y-0.5 transition-transform" /> Descargar My Omni (PDF)
                            </button>
                            <button 
                                onClick={contactAgent}
                                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all flex items-center gap-2 shadow-xl shadow-emerald-500/20 group/wa"
                            >
                                <Zap className="w-5 h-5 group-hover/wa:rotate-12 transition-transform" /> Contactar Agente y Emitir
                            </button>
                        </div>

                        {/* Specific Coverages Table */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            {quoteData.coverages?.slice(0, 10).map((cov: any, idx: number) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    viewport={{ once: true }}
                                    className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl group hover:bg-white/10 hover:border-white/20 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform">
                                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <span className="text-slate-200 font-bold text-base leading-tight">{cov.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-white font-black text-[10px] uppercase tracking-tighter bg-black/20 px-3 py-1 rounded-lg">{cov.limit || 'Amparado'}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ SECTION - EDUCATING THE CLIENT */}
            <section className="py-24 px-6 max-w-4xl mx-auto space-y-16">
                <div className="text-center space-y-4">
                     <h3 className="text-4xl font-black text-slate-900 tracking-tight">Preguntas Resolutivas</h3>
                     <p className="text-lg text-slate-500">Todo lo que necesitas saber antes de blindar tu futuro.</p>
                </div>
                
                <div className="space-y-4">
                    {template.faq.map((item: any, idx: number) => (
                        <div key={idx} className="border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
                            <button
                                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                className="w-full p-8 text-left flex items-center justify-between font-black text-slate-700 hover:bg-slate-50 transition-colors gap-4"
                            >
                                <span className="text-lg tracking-tight leading-tight">{item.q}</span>
                                <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform shrink-0 ${openFaq === idx ? 'rotate-180' : ''}`} />
                            </button>
                            {openFaq === idx && (
                                <div className="p-8 bg-slate-50 text-slate-600 font-medium border-t border-slate-100 leading-relaxed text-lg animate-in fade-in slide-in-from-top-4">
                                    {item.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* TRUST FOOTER */}
            <footer className="py-20 bg-slate-900 text-center px-6 border-t border-white/5 relative">
                {/* Bottom Watermark */}
                <div className="absolute bottom-4 right-4 opacity-30 pointer-events-none">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">By Proyectos RB | v3.11 OMNI ELITE</p>
                </div>

                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="space-y-4">
                        <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-6 scale-110" />
                        <p className="text-slate-300 text-xl font-medium max-w-2xl mx-auto leading-relaxed italic">
                            "La seguridad no es un gasto, es la inversión que garantiza el estilo de vida que has construido con tanto esfuerzo."
                        </p>
                    </div>
                    
                    <div className="pt-12 border-t border-white/10 flex flex-col items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-lg font-black text-white shadow-2xl rotate-3">RB</div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none mb-1">Elite Partner Innovation</p>
                                <p className="text-lg font-black text-white tracking-tighter">RB PROYECTOS <span className="text-emerald-500 font-medium">| Digital Broker</span></p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status: Propuesta Omni Elite Combo Activa v3.11</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
