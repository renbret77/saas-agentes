const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function main() {
    const envPath = 'C:\\Users\\RENE\\OneDrive - renebreton.mx\\PROYECTO_SAAS_SEGUROS\\portal\\.env.local';
    const envData = fs.readFileSync(envPath, 'utf8');

    let supabaseUrl = '';
    let supabaseKey = '';

    for (const line of envData.split('\n')) {
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
        if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
    }

    if (!supabaseUrl || !supabaseKey) {
        console.log('Credentials missing. Using ANON key as fallback if missing service key.');
        // Let's try ANON key if SERVICE KEY is missing
        for (const line of envData.split('\n')) {
            if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
        }
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
    });

    console.log("Connected to Supabase. Querying profiles for 'prueba'...");

    // Check Profiles
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').ilike('full_name', 'prueba%');
    console.log(profiles || pErr);

    // Check Users in `auth.users` via RPC if possible or via joining (actually service role can query `auth.users` but we might not have it).
    // Let's query policies to see how many we can see with Service Role
    const { count: policiesCount } = await supabase.from('policies').select('*', { count: 'exact', head: true });
    console.log("Total policies in DB (Service Role):", policiesCount);

    // Let's check the active policies in PG directly via an RPC call.
    // Wait, the user might not have an RPC. 
    // What about querying `pg_policies`? That is not accessible via PostgREST directly unless exposed.

    // But let's check profile role and agency_id for `prueba`
    const { data: qProfiles } = await supabase.from('profiles').select('id, full_name, role, agency_id, created_at').limit(10);
    console.log("Sample Profiles:", qProfiles);

}
main();
