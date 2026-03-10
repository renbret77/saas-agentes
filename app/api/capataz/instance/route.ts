import { NextRequest, NextResponse } from "next/server";
import { evolutionService } from "@/lib/evolution";
import { createClient } from "@supabase/supabase-js";

// This would typically come from your auth session
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const instanceName = searchParams.get('instanceName');

        if (!instanceName) {
            return NextResponse.json({ error: 'Instance name required' }, { status: 400 });
        }

        const state = await evolutionService.getInstanceState(instanceName);
        return NextResponse.json(state);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, instanceName } = body;

        if (action === 'create') {
            const result = await evolutionService.createInstance(instanceName);
            return NextResponse.json(result);
        }

        if (action === 'connect') {
            const qr = await evolutionService.getQrCode(instanceName);
            return NextResponse.json(qr);
        }

        if (action === 'logout') {
            const result = await evolutionService.logoutInstance(instanceName);
            return NextResponse.json(result);
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
