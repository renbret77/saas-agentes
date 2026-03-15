import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(req: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Need service role to see all agency data
        
        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: "Config error" }, { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseKey)
        const authHeader = req.headers.get("Authorization")
        
        // 1. Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser(
            authHeader?.split(" ")[1] || ""
        )

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 2. Check Role (Admin/Superadmin only)
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, agency_id')
            .eq('id', user.id)
            .single()

        if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const agencyId = profile.agency_id
        if (!agencyId) return NextResponse.json({ error: "No agency assigned" }, { status: 404 })

        // 3. Aggregate Data
        // - Agents in agency
        const { data: agents, error: agentsError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('agency_id', agencyId)

        if (agentsError) throw agentsError

        const agentIds = agents.map(a => a.id)

        // - Clients count
        const { count: totalClients } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .in('user_id', agentIds)

        // - Policies count
        const { count: totalPolicies } = await supabase
            .from('policies')
            .select('*', { count: 'exact', head: true })
            .in('client_id', (
                await supabase.from('clients').select('id').in('user_id', agentIds)
            ).data?.map(c => c.id) || [])

        // - Agent breakdown
        const breakdown = await Promise.all(agents.map(async (agent) => {
            const { count: cCount } = await supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', agent.id)
            
            const { count: pCount } = await supabase
                .from('policies')
                .select('*', { count: 'exact', head: true })
                .in('client_id', (
                    await supabase.from('clients').select('id').eq('user_id', agent.id)
                ).data?.map(c => c.id) || [])

            return {
                id: agent.id,
                name: agent.full_name || agent.email,
                clients: cCount || 0,
                policies: pCount || 0
            }
        }))

        return NextResponse.json({
            stats: {
                totalAgents: agents.length,
                totalClients: totalClients || 0,
                totalPolicies: totalPolicies || 0,
            },
            agents: breakdown
        })

    } catch (error: any) {
        console.error("[Enterprise API Error]", error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
