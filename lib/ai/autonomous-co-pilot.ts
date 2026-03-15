import { supabase } from "../supabase"
import { CommunicationService } from "../communications"
import { WebhookService } from "../webhooks"

export class AutonomousCoPilot {
    /**
     * Revisa el estado del pipeline y ejecuta acciones de seguimiento autónomas
     */
    static async runCycle(agentId: string) {
        // 1. Verificar si está habilitado en agent_settings
        const { data: settings } = await supabase
            .from('agent_settings')
            .select('autonomous_followup_enabled')
            .eq('user_id', agentId)
            .single()

        if (!settings?.autonomous_followup_enabled) return

        // 2. Obtener prospectos estancados (> 3 días en la misma etapa)
        // Nota: Asumimos que crm_pipeline tiene updated_at
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        
        const { data: stagnantLeads } = await supabase
            .from('crm_pipeline')
            .select('*, clients(*)')
            .eq('agent_id', agentId)
            .lt('updated_at', threeDaysAgo)
            .not('stage', 'eq', 'Won')
            .not('stage', 'eq', 'Lost')

        if (!stagnantLeads || stagnantLeads.length === 0) return

        for (const lead of stagnantLeads) {
            await this.processFollowUp(lead)
        }
    }

    private static async processFollowUp(lead: any) {
        const client = lead.clients
        if (!client) return

        // 3. Ejecutar acción de seguimiento (Ejemplo: Enviar correo de "Re-contacto")
        // En una versión más avanzada, esto usaría OpenAI para generar un mensaje personalizado
        try {
            await CommunicationService.sendTemplateEmail({
                to: client.email,
                template: 'GENERAL_MESSAGE',
                data: {
                    first_name: client.first_name,
                    subject: `¿Cómo va todo con tu propuesta, ${client.first_name}?`,
                    message: `Hola ${client.first_name}, ha pasado un tiempo desde nuestra última charla sobre tu seguro. ¿Tienes alguna duda pendiente? Estoy aquí para ayudarte.`
                }
            })

            // 4. Disparar Webhook de seguimiento autónomo
            await WebhookService.trigger(lead.agent_id, 'lead.converted', {
                lead_id: lead.id,
                action: 'autonomous_followup_sent',
                timestamp: new Date().toISOString()
            })

            // 5. Actualizar timestamp del lead para que no se vuelva a disparar hoy
            await supabase
                .from('crm_pipeline')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', lead.id)

        } catch (error) {
            console.error(`Error in autonomous follow-up for lead ${lead.id}:`, error)
        }
    }
}
