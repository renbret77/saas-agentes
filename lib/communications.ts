import { supabase } from './supabase';
import { EMAIL_TEMPLATES } from './email-templates';

export interface EmailOptions {
    to: string;
    cc?: string;
    subject: string;
    body: string;
    clientId?: string;
    category?: EmailCategory;
    attachments?: Array<{ filename: string; content: any }>;
    customMessage?: string;
}

export type EmailCategory = 'new_policy' | 'renewal' | 'pre_renewal' | 'overdue' | 'birthday' | 'manual' | 'campaign';

export class CommunicationService {
    static async sendEmail(options: EmailOptions) {
        // 1. Get Agent Config
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No authenticated user");

        const { data: config } = await supabase
            .from('communication_configs')
            .select('*')
            .eq('agent_id', user.id)
            .single();

        // 2. Wrap body with layout and tracking pixel
        const trackingId = crypto.randomUUID();
        // Use window.location.origin if in browser, or ENV if in server
        const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || '';
        const trackingPixel = `<img src="${origin}/api/communications/track/open?id=${trackingId}" width="1" height="1" style="display:none" />`;
        
        let finalBody = options.body;
        
        // Add Privacy Notice if enabled
        if (config?.use_privacy_notice !== false) {
            const notice = config?.custom_privacy_notice || EMAIL_TEMPLATES.PRIVACY_NOTICE;
            finalBody += notice;
        }

        finalBody += trackingPixel;

        // 3. Register log entry
        const { data: logEntry, error: logError } = await supabase
            .from('communication_logs')
            .insert({
                id: trackingId,
                agent_id: user.id,
                client_id: options.clientId,
                type: 'email',
                category: options.category || 'manual',
                recipient: options.to,
                subject: options.subject,
                body_html: finalBody,
                status: 'pending'
            })
            .select()
            .single();

        if (logError) console.error("Error logging communication:", logError);

        // 4. Trigger sending via API (Proxy to actual provider like Resend/SMTP)
        try {
            const response = await fetch('/api/communications/dispatch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    logId: trackingId,
                    config,
                    payload: {
                        to: options.to,
                        cc: options.cc,
                        subject: options.subject,
                        html: finalBody,
                        attachments: options.attachments
                    }
                })
            });

            if (!response.ok) throw new Error("Failed to dispatch email");

            // Update status to sent
            await supabase
                .from('communication_logs')
                .update({ status: 'sent' })
                .eq('id', trackingId);

            return { success: true, logId: trackingId };
        } catch (error) {
            console.error("Email Dispatch Error:", error);
            await supabase
                .from('communication_logs')
                .update({ status: 'failed', metadata: { error: (error as Error).message } })
                .eq('id', trackingId);
            throw error;
        }
    }

    static generateTemplate(category: EmailCategory, data: any, config?: any) {
        let content = '';
        switch (category) {
            case 'new_policy':
                content = EMAIL_TEMPLATES.NEW_POLICY(data.clientName, data.policyNumber, data.insurer, data.branch, data.startDate, data.expiryDate);
                break;
            case 'renewal':
                content = EMAIL_TEMPLATES.RENEWAL(data.clientName, data.policyNumber, data.expiryDate, data.insurer, data.branch, data.startDate);
                break;
            case 'pre_renewal':
                content = EMAIL_TEMPLATES.PRE_RENEWAL(data.clientName, data.policyNumber, data.expiryDate, data.insurer, data.branch, data.startDate);
                break;
            case 'overdue':
                content = EMAIL_TEMPLATES.OVERDUE(data.clientName, data.policyNumber, data.insurer, data.branch, data.totalPremium);
                break;
            case 'birthday':
                content = EMAIL_TEMPLATES.BIRTHDAY(data.clientName);
                break;
            case 'manual':
                content = EMAIL_TEMPLATES.GENERAL_MESSAGE(data.clientName);
                break;
            default:
                content = data.body || '';
        }

        // 1. Inyectar imagen de cumpleaños si es la categoría
        if (category === 'birthday') {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'https://portal-eight-kohl.vercel.app';
            const birthdayImg = `${baseUrl}/birthday_premium.png`;
            const imgHtml = `
                <div style="margin-bottom: 30px; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                    <img src="${birthdayImg}" alt="Feliz Cumpleaños" style="width: 100%; display: block;">
                </div>
            `;
            content = content.replace('{{BIRTHDAY_IMAGE}}', imgHtml);
        }

        // 2. Inject custom message if provided
        const customMsg = data.customMessage || '';
        if (customMsg) {
            const msgHtml = `
                <div style="margin: 20px 0; padding: 15px; background: #f1f5f9; border-left: 4px solid #4f46e5; font-style: italic; border-radius: 4px;">
                    ${customMsg}
                </div>
            `;
            content = content.replace('{{CUSTOM_MESSAGE}}', msgHtml);
        } else {
            content = content.replace('{{CUSTOM_MESSAGE}}', '');
        }

        // 3. Inject Installments Table if available
        if (content.includes('{{INSTALLMENTS_TABLE}}')) {
            const installments = data.installments || [];
            if (installments.length > 0) {
                let tableHtml = `
                    <div style="margin: 30px 0; background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
                        <div style="background: #f1f5f9; padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
                            <h3 style="margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">Calendario de Pagos</h3>
                        </div>
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                            <thead style="background: #f8fafc;">
                                <tr>
                                    <th style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 800; font-size: 10px; text-transform: uppercase;">Recibo</th>
                                    <th style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 800; font-size: 10px; text-transform: uppercase;">Vencimiento</th>
                                    <th style="padding: 12px 15px; text-align: right; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 800; font-size: 10px; text-transform: uppercase;">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                installments.sort((a: any, b: any) => a.installment_number - b.installment_number).forEach((inst: any) => {
                    const amount = typeof inst.total_amount === 'number' 
                        ? inst.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : inst.total_amount;
                    
                    const dueDate = inst.due_date ? new Date(inst.due_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '---';

                    tableHtml += `
                                <tr style="border-bottom: 1px solid #f8fafc;">
                                    <td style="padding: 12px 15px; font-weight: 700; color: #1e293b;">${inst.installment_number}</td>
                                    <td style="padding: 12px 15px; color: #64748b;">${dueDate}</td>
                                    <td style="padding: 12px 15px; text-align: right; font-weight: 800; color: #0f172a;">$${amount}</td>
                                </tr>
                    `;
                });

                tableHtml += `
                            </tbody>
                        </table>
                        <div style="background: #f8fafc; padding: 10px 20px; border-top: 1px solid #e2e8f0; text-align: right;">
                            <span style="font-size: 10px; font-weight: 700; color: #64748b;">TOTAL PRIMA: $${data.totalPremium || '0.00'}</span>
                        </div>
                    </div>
                `;
                content = content.replace('{{INSTALLMENTS_TABLE}}', tableHtml);
            } else {
                content = content.replace('{{INSTALLMENTS_TABLE}}', '');
            }
        }

        // 4. Inject Portal URL
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || '';
        const portalUrl = data.portalUrl || baseUrl;
        content = content.replace(/{{PORTAL_URL}}/g, portalUrl);

        // 5. Inject Video CTA
        if (data.videoUrl) {
            const videoHtml = EMAIL_TEMPLATES.VIDEO_CTA(data.videoUrl);
            content = content.replace('{{VIDEO_CTA}}', videoHtml);
        } else {
            content = content.replace('{{VIDEO_CTA}}', '');
        }
        
        return content;
    }
}
