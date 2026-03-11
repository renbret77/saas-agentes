export interface EvolutionInstance {
    instanceName: string;
    owner: string;
    profileName: string;
    profilePicture: string;
    status: 'open' | 'close' | 'connecting';
    serverUrl: string;
    apikey: string;
}

export class EvolutionService {
    private baseUrl: string;
    private apiKey: string;

    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || '';
        this.apiKey = process.env.EVOLUTION_API_KEY || '';
    }

    private async request(endpoint: string, method: string = 'GET', body?: any) {
        if (!this.baseUrl || !this.apiKey) {
            throw new Error('Evolution API configuration missing');
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'apikey': this.apiKey
            },
            body: body ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Evolution API Error');
        }

        return response.json();
    }

    /**
     * Create a new Capataz instance for an agent
     */
    async createInstance(instanceName: string) {
        return this.request('/instance/create', 'POST', {
            instanceName,
            token: '', // Let Evolution generate one
            qrcode: true,
            number: ''
        });
    }

    /**
     * Get the QR code for pairing
     */
    async getQrCode(instanceName: string) {
        return this.request(`/instance/connect/${instanceName}`);
    }

    /**
     * Set webhooks to point to our Capataz processing endpoint
     */
    async setWebhooks(instanceName: string, webhookUrl: string) {
        return this.request(`/webhook/set/${instanceName}`, 'POST', {
            url: webhookUrl,
            enabled: true,
            events: [
                'MESSAGES_UPSERT',
                'MESSAGES_UPDATE',
                'SEND_MESSAGE'
            ]
        });
    }

    /**
     * Disconnect/Logout instance
     */
    async logoutInstance(instanceName: string) {
        return this.request(`/instance/logout/${instanceName}`, 'DELETE');
    }

    /**
     * Delete instance completely
     */
    async deleteInstance(instanceName: string) {
        return this.request(`/instance/delete/${instanceName}`, 'DELETE');
    }

    /**
     * Check instance state
     */
    async getInstanceState(instanceName: string) {
        return this.request(`/instance/connectionState/${instanceName}`);
    }

    /**
     * Download media from Evolution
     */
    async downloadMedia(instanceName: string, message: any) {
        return this.request(`/media/download/${instanceName}`, 'POST', {
            message
        });
    }

    /**
     * Send a message back via WhatsApp
     */
    async sendMessage(instanceName: string, number: string, text: string) {
        return this.request(`/message/sendText/${instanceName}`, 'POST', {
            number,
            text,
            linkPreview: true
        });
    }
}

export const evolutionService = new EvolutionService();
