import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const logId = searchParams.get('id');

    if (logId) {
        try {
            // Update tracking info in DB
            const { data: log } = await supabase
                .from('communication_logs')
                .select('open_count')
                .eq('id', logId)
                .single();

            await supabase
                .from('communication_logs')
                .update({
                    opened_at: new Date().toISOString(),
                    last_opened_at: new Date().toISOString(),
                    open_count: (log?.open_count || 0) + 1,
                    status: 'opened'
                })
                .eq('id', logId);
        } catch (error) {
            console.error("Tracking Error:", error);
        }
    }

    // Return a 1x1 transparent GIF
    const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
    );

    return new NextResponse(pixel, {
        headers: {
            'Content-Type': 'image/gif',
            'Content-Length': pixel.length.toString(),
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        },
    });
}
