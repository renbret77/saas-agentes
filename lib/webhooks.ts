import { supabase } from "./supabase"

export type WebhookEvent = 'client.created' | 'policy.renewed' | 'payment.overdue' | 'lead.converted'

export class WebhookService {
    /**
     * Registra un evento y dispara los webhooks activos
     */
    static async trigger(agentId: string, event: WebhookEvent, payload: any) {
        // 1. Buscar webhooks activos para este evento y agente
        const { data: webhooks, error } = await supabase
            .from('outgoing_webhooks')
            .select('*')
            .eq('agent_id', agentId)
            .eq('event_type', event)
            .eq('is_active', true)

        if (error || !webhooks || webhooks.length === 0) return

        // 2. Disparar cada uno de forma asíncrona (simulado mediante logs inmediatos)
        for (const wh of webhooks) {
            this.send(wh, payload)
        }
    }

    private static async send(webhook: any, payload: any) {
        try {
            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-RB-Secret': webhook.secret_key,
                    ...webhook.headers
                },
                body: JSON.stringify({
                    id: crypto.randomUUID(),
                    event: webhook.event_type,
                    timestamp: new Date().toISOString(),
                    data: payload
                })
            })

            const success = response.ok
            
            // Loguear resultado
            await supabase.from('webhook_logs').insert({
                webhook_id: webhook.id,
                payload: payload,
                response_code: response.status,
                response_body: await response.text().catch(() => 'Error reading body'),
                success: success
            })

            // Actualizar timestamp del webhook
            await supabase.from('outgoing_webhooks')
                .update({ last_triggered_at: new Date().toISOString() })
                .eq('id', webhook.id)

        } catch (error: any) {
            console.error(`Error triggering webhook ${webhook.id}:`, error)
            await supabase.from('webhook_logs').insert({
                webhook_id: webhook.id,
                payload: payload,
                response_code: 0,
                response_body: error.message,
                success: false
            })
        }
    }

    /**
     * Obtiene los webhooks configurados por el agente
     */
    static async getWebhooks(agentId: string) {
        const { data, error } = await supabase
            .from('outgoing_webhooks')
            .select('*, logs:webhook_logs(count)')
            .eq('agent_id', agentId)
        
        if (error) throw error
        return data
    }
}
