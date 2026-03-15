import { Sidebar } from "@/components/dashboard/sidebar"
import VoiceCommandInterface from "@/components/dashboard/VoiceCommandInterface"
import { VersionBanner } from "@/components/dashboard/VersionBanner"
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'v3.0.0 [OMNI ELITE] | Portal Proyectos',
  description: 'Sistema de Gestión Elite para Agentes de Clase Mundial',
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <VersionBanner />
            <div className="flex-1 lg:flex h-full overflow-hidden">
                <Sidebar />
                <main className="flex-1 h-screen overflow-y-auto relative custom-scrollbar">
                    <div className="p-8 max-w-7xl mx-auto">
                        {children}
                    </div>
                    <VoiceCommandInterface />
                </main>
            </div>
        </div>
    )
}
