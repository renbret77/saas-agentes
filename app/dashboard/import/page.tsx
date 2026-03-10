"use client"

import { useState, useEffect } from "react"
import { Upload, FileText, CheckCircle2, ChevronRight, AlertCircle, ArrowLeft, Table, Database, RefreshCw, Trash2, Info, Sparkles, Cpu, Plus } from "lucide-react"
import Link from "next/link"
import Papa from "papaparse"
import { supabase } from "@/lib/supabase"
import { IMPORT_SCHEMAS } from "@/lib/import-schemas"

type ImportStep = 1 | 2 | 3 | 4 // 1: Upload, 2: Map, 3: Preview, 4: Done

export default function ImportPage() {
    const [step, setStep] = useState<ImportStep>(1)
    const [importType, setImportType] = useState<'clients' | 'policies'>('clients')
    const [file, setFile] = useState<File | null>(null)
    const [csvData, setCsvData] = useState<any[]>([])
    const [csvHeaders, setCsvHeaders] = useState<string[]>([])
    const [mapping, setMapping] = useState<Record<string, string>>({})
    const [isProcessing, setIsProcessing] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [results, setResults] = useState({ success: 0, error: 0, details: [] as string[] })

    const schemaTargets = IMPORT_SCHEMAS

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return
        setFile(selectedFile)

        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            preview: 5,
            complete: (results) => {
                const data = results.data as any[]
                if (data && data.length > 0) {
                    setCsvHeaders(Object.keys(data[0]))
                    setCsvData(data)
                    // Auto-mapeo básico por nombres parecidos
                    const initialMapping: Record<string, string> = {}
                    const targets = schemaTargets[importType]
                    Object.keys(data[0]).forEach(header => {
                        const h = header.toLowerCase()
                        targets.forEach((t: any) => {
                            if (h.includes(t.key.toLowerCase()) || h.includes(t.label.toLowerCase())) {
                                initialMapping[t.key] = header
                            }
                        })
                    })
                    setMapping(initialMapping)
                }
            }
        })
    }

    const handleAiAnalysis = async () => {
        if (!csvHeaders.length || !csvData.length) return
        setIsAnalyzing(true)

        try {
            const response = await fetch('/api/import/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    importType,
                    headers: csvHeaders,
                    sampleData: csvData.slice(0, 3)
                })
            })

            const result = await response.json()
            if (result.mapping) {
                setMapping(prev => ({ ...prev, ...result.mapping }))
            }
        } catch (error) {
            console.error("AI Analysis failed:", error)
        } finally {
            setIsAnalyzing(false)
        }
    }

    const startImport = async () => {
        if (!file) return
        setIsProcessing(true)
        setStep(3)
        setProgress(0)

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            chunk: async (results, parser) => {
                parser.pause()
                const dataToImport = results.data.map((row: any) => {
                    const obj: any = {}
                    Object.entries(mapping).forEach(([targetKey, csvHeader]) => {
                        if (csvHeader) obj[targetKey] = row[csvHeader]
                    })
                    return obj
                })

                // Ejecutar la importación vía RPC
                const rpcName = importType === 'clients' ? 'bulk_import_clients' : 'bulk_import_policies'
                const rpcArg = importType === 'clients' ? { client_data: dataToImport } : { policy_data: dataToImport }

                const { data: rpcResult, error } = await supabase.rpc(rpcName as any, rpcArg as any)

                if (error) {
                    console.error('RPC Error:', error)
                    setResults(prev => ({ ...prev, error: prev.error + dataToImport.length }))
                } else {
                    const res = rpcResult as any
                    setResults(prev => ({
                        ...prev,
                        success: prev.success + (res?.success || 0),
                        error: prev.error + (res?.errors || 0)
                    }))
                }

                setProgress(prev => Math.min(prev + 20, 100))
                parser.resume()
            },
            complete: () => {
                setIsProcessing(false)
                setStep(4)
                setProgress(100)
            }
        })
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Link href="/dashboard" className="text-slate-500 hover:text-emerald-600 flex items-center gap-1 text-sm font-medium transition-colors mb-2">
                        <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Migración Inteligente</h1>
                    <p className="text-slate-500">Importador de RB Proyectos con mapeo asistido por IA.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-xl border border-slate-800 text-white text-xs font-bold uppercase tracking-widest">
                    <Cpu className="w-4 h-4 text-emerald-400" /> Powered by RB Proyectos
                </div>
            </div>

            {/* Steps Indicator */}
            <div className="flex items-center justify-center gap-4">
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${step >= s ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {s}
                        </div>
                        {s < 4 && <div className={`w-12 h-1 bg-slate-200 rounded-full overflow-hidden`}>
                            <div className={`h-full bg-emerald-600 transition-all duration-500 ${step > s ? 'w-full' : 'w-0'}`}></div>
                        </div>}
                    </div>
                ))}
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
                {/* Step 1: Selection & Upload */}
                {step === 1 && (
                    <div className="p-12 flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex gap-4 p-1 bg-slate-100 rounded-2xl w-full max-w-sm">
                            <button
                                onClick={() => setImportType('clients')}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${importType === 'clients' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Clientes
                            </button>
                            <button
                                onClick={() => setImportType('policies')}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${importType === 'policies' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Pólizas
                            </button>
                        </div>

                        <div className="w-full max-w-lg">
                            <label className="group flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 rounded-3xl cursor-pointer bg-slate-50 hover:bg-emerald-50 hover:border-emerald-400 transition-all">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors mb-4">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <p className="text-lg font-bold text-slate-700">Subir reporte (Excel/CSV)</p>
                                    <p className="text-xs text-slate-500 mt-2">Formatos aceptados: .csv (UTF-8 recomendado)</p>
                                </div>
                                <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                            </label>
                        </div>

                        {file && (
                            <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 w-full max-w-lg animate-in slide-in-from-bottom-2">
                                <FileText className="w-8 h-8 text-emerald-600" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-emerald-900">{file.name}</p>
                                    <p className="text-xs text-emerald-600">Archivo detectado exitosamente</p>
                                </div>
                                <button
                                    onClick={() => setStep(2)}
                                    className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all"
                                >
                                    Siguiente: Mapear Columnas
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Mapping */}
                {step === 2 && (
                    <div className="p-8 flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Mapeo de Datos</h2>
                                <p className="text-slate-500 text-sm">Relaciona las columnas del CSV con los campos de RB Proyectos.</p>
                            </div>
                            <button
                                onClick={handleAiAnalysis}
                                disabled={isAnalyzing}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-emerald-400 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all border border-slate-700 shadow-xl disabled:opacity-50"
                            >
                                {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Mapeo Mágico (IA)
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    Campos Requeridos
                                </h3>
                                {(schemaTargets[importType] as any[]).filter((t: any) => t.required).map((target: any) => (
                                    <div key={target.key} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-700">{target.label}</span>
                                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-black uppercase">Requerido</span>
                                        </div>
                                        <select
                                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                            value={mapping[target.key] || ""}
                                            onChange={(e) => setMapping({ ...mapping, [target.key]: e.target.value })}
                                        >
                                            <option value="">Seleccionar columna...</option>
                                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Campos Opcionales</h3>
                                {(schemaTargets[importType] as any[]).filter((t: any) => !t.required).map((target: any) => (
                                    <div key={target.key} className="flex items-center gap-4 justify-between p-3 border-b border-slate-100">
                                        <span className="text-sm text-slate-600 font-medium">{target.label}</span>
                                        <select
                                            className="w-1/2 p-2 rounded-lg border border-slate-100 bg-slate-50 text-xs text-slate-500"
                                            value={mapping[target.key] || ""}
                                            onChange={(e) => setMapping({ ...mapping, [target.key]: e.target.value })}
                                        >
                                            <option value="">No Mapear</option>
                                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-12 flex justify-end gap-4 border-t border-slate-100 pt-8">
                            <button onClick={() => setStep(1)} className="px-6 py-2.5 text-slate-500 font-bold hover:text-slate-700 transition-colors">Atrás</button>
                            <button
                                onClick={startImport}
                                disabled={!Object.values(mapping).some(v => v !== "") || isProcessing}
                                className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 transition-all"
                            >
                                <RefreshCw className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
                                Iniciar Importación Mágica
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Processing */}
                {step === 3 && (
                    <div className="p-12 flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-300">
                        <div className="relative w-48 h-48 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="96" cy="96" r="88"
                                    className="stroke-slate-100 fill-none"
                                    strokeWidth="12"
                                />
                                <circle
                                    cx="96" cy="96" r="88"
                                    className="stroke-emerald-500 fill-none transition-all duration-500"
                                    strokeWidth="12"
                                    strokeDasharray={552.92}
                                    strokeDashoffset={552.92 - (552.92 * progress) / 100}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-4xl font-black text-emerald-600">{progress}%</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Migrando...</span>
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold text-slate-900">Procesando registros...</h3>
                            <p className="text-slate-500 max-w-sm">Estamos conectando con Supabase e inyectando los datos de forma segura. No cierres esta pestaña.</p>
                        </div>
                    </div>
                )}

                {/* Step 4: Done */}
                {step === 4 && (
                    <div className="p-12 flex-1 flex flex-col items-center justify-center space-y-10 animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-12 h-12" />
                        </div>
                        <div className="text-center space-y-4">
                            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">¡Migración Completada!</h3>
                            <div className="flex gap-4 justify-center">
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center min-w-[120px]">
                                    <p className="text-2xl font-black text-emerald-600">{results.success}</p>
                                    <p className="text-[10px] font-bold text-emerald-800 uppercase">Exitosos</p>
                                </div>
                                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center min-w-[120px]">
                                    <p className="text-2xl font-black text-rose-600">{results.error}</p>
                                    <p className="text-[10px] font-bold text-rose-800 uppercase">Errores</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 w-full max-w-md">
                            <Link href="/dashboard" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold text-center hover:bg-slate-800 transition-all shadow-lg active:scale-95">Ir al Inicio</Link>
                            <button onClick={() => setStep(1)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95">Nueva Importación</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Info Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4 text-blue-900 shadow-sm">
                    <Info className="w-6 h-6 shrink-0" />
                    <div className="text-xs leading-relaxed">
                        <span className="font-bold">Formato UTF-8:</span> Asegúrate de guardar tu reporte de SICAS como CSV delimitado por comas con codificación UTF-8 para evitar errores en acentos y caracteres especiales.
                    </div>
                </div>
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-4 text-indigo-900 shadow-sm">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <div className="text-xs leading-relaxed">
                        <span className="font-bold">Seguridad SICAS:</span> No guardamos tus archivos CSV después de la importación. Todo el procesamiento ocurre en tiempo real directamente hacia tu base de datos de Supabase.
                    </div>
                </div>
            </div>
        </div>
    )
}

function PlusIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}
