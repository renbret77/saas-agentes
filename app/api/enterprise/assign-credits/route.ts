import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { agentId, amount, notes } = body;

    // Get current user (Admin)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.split(' ')[1]);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify user is an admin or superadmin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Call the database function to assign credits
    const { error: rpcError } = await supabaseAdmin.rpc('assign_credits', {
      p_admin_id: user.id,
      p_agent_id: agentId,
      p_amount: amount,
      p_notes: notes || 'Asignación manual desde Consola Enterprise'
    });

    if (rpcError) throw rpcError;

    return NextResponse.json({ success: true, message: 'Créditos asignados correctamente' });

  } catch (error) {
    console.error('Error assigning credits:', error);
    return NextResponse.json({ success: false, error: 'Failed to assign credits' }, { status: 500 });
  }
}
