import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function findInsurers() {
    const { data, error } = await supabase
        .from('insurers')
        .select('id, name, alias')
        .or('name.ilike.%Chubb%,name.ilike.%Monterrey%,name.ilike.%GNP%,name.ilike.%AXA%')

    if (error) {
        console.error(error)
        return
    }
    console.log(JSON.stringify(data, null, 2))
}

findInsurers()
