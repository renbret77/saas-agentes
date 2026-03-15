import { supabase } from "../supabase"

export interface ExecutiveSummary {
    totalActiveClients: number
    expectedToday: number
    overdueInstallmentsCount: number
    upcomingRenewalsWeek: number
}

export class AIExecutiveBriefing {
    /**
     * Obtiene el resumen ejecutivo consolidado desde la vista SQL
     */
    static async getSummary(agentId: string): Promise<ExecutiveSummary | null> {
        const { data, error } = await supabase
            .from('view_daily_executive_summary')
            .select('*')
            .eq('agent_id', agentId)
            .single()

        if (error || !data) {
            console.error("Error fetching executive summary:", error)
            return null
        }

        return {
            totalActiveClients: data.total_active_clients || 0,
            expectedToday: data.expected_today || 0,
            overdueInstallmentsCount: data.overdue_installments_count || 0,
            upcomingRenewalsWeek: data.upcoming_renewals_week || 0
        }
    }

    /**
     * Genera un script narrativo basado en los datos del resumen
     */
    static generateScript(summary: ExecutiveSummary, agentName: string = "Agente"): string {
        const greeting = this.getGreeting()
        
        let script = `${greeting} ${agentName}. Aquí tienes tu reporte ejecutivo PRO. `
        
        if (summary.expected_today > 0) {
            script += `Hoy es un gran día para la cobranza. Esperamos recibir un total de ${Number(summary.expected_today).toLocaleString()} pesos. `
        } else {
            script += `Hoy no hay pagos programados, excelente momento para prospectar. `
        }

        if (summary.overdue_installments_count > 0) {
            script += `Atención: Tenemos ${summary.overdue_installments_count} recibos vencidos que requieren tu intervención inmediata. `
        }

        if (summary.upcoming_renewals_week > 0) {
            script += `Esta semana vencen ${summary.upcoming_renewals_week} pólizas. Ya he preparado las propuestas de renovación en tu bandeja. `
        }

        script += `Tu red de ${summary.total_active_clients} clientes está sólida. ¡Vamos por un día productivo!`

        return script
    }

    private static getGreeting(): string {
        const hour = new Date().getHours()
        if (hour < 12) return "Buenos días"
        if (hour < 18) return "Buenas tardes"
        return "Buenas noches"
    }
}
