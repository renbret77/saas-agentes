import { Shield, FileText, Download, ExternalLink } from "lucide-react"
import { Metadata } from 'next'

interface Props {
  searchParams: Promise<{
    p?: string; // Path (filename only)
    n?: string; // Name
    t?: string; // Type
  }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { n, t } = await searchParams
  const name = n ? decodeURIComponent(n) : 'Cliente'
  const type = t ? decodeURIComponent(t) : 'Documento'
  
  return {
    title: `${type} Digital | ${name}`,
    description: `Portal de Protección Premium - Visualice su ${type.toLowerCase()} de forma segura.`
  }
}

export default async function PortalViewPage({ searchParams }: Props) {
  const { p, n, t } = await searchParams
  
  if (!p) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Enlace No Disponible</h1>
          <p className="text-slate-500 text-sm">El documento que intenta visualizar ya no está disponible o el enlace es incorrecto.</p>
        </div>
      </div>
    )
  }

  const supabaseUrl = "https://wctezsysrmaoamtuzzts.supabase.co/storage/v1/object/public/client_docs/caratulas/"
  const fileUrl = `${supabaseUrl}${decodeURIComponent(p)}`
  const clientName = n ? decodeURIComponent(n) : 'Cliente'
  const docType = t ? decodeURIComponent(t) : 'Documento'

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center min-h-screen">
        {/* Branding */}
        <div className="flex flex-col items-center gap-4 mb-12 text-center">
          <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Portal Digital</h2>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">Rene Breton <br/><span className="text-emerald-600">Seguros</span></h1>
          </div>
        </div>

        {/* Card */}
        <div className="w-full bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-white/50 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100/50 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Documento Verificado
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{docType}</h3>
            <p className="text-slate-500">Estimado(a) <span className="font-bold text-slate-700">{clientName}</span>, su carátula digital está lista para visualización.</p>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-4 transition-all hover:bg-white hover:shadow-md group">
            <div className="w-12 h-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-bold text-sm text-slate-900 truncate">{docType}.pdf</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Certificado Digital</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative flex items-center justify-center gap-3 w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-black transition-all hover:-translate-y-1 active:translate-y-0"
            >
              <ExternalLink className="w-5 h-5" />
              Abrir Documento
            </a>
            
            <a 
              href={fileUrl} 
              download={`${docType}_${clientName.replace(/\s+/g, '_')}.pdf`}
              className="flex items-center justify-center gap-3 w-full py-4 bg-white text-slate-700 rounded-2xl font-bold text-sm border border-slate-200 hover:bg-slate-50 transition-all"
            >
              <Download className="w-4 h-4" />
              Descargar Archivo
            </a>
          </div>
          
          <p className="text-[10px] text-center text-slate-400 font-medium px-6">
            Este es un canal de entrega seguro. Por su seguridad, no comparta este enlace con terceros.
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-auto pt-12 text-center space-y-4">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
            Desarrollado por Capataz Tech
          </p>
        </footer>
      </main>
    </div>
  )
}
