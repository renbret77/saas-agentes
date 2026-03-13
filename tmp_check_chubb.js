
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wctezsysrmaoamtuzzts.supabase.co';
const supabaseKey = 'sb_publishable_kFlL4DRVepXpf1uIaYrl2g_hHivsek4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInsurers() {
  const { data, error } = await supabase.from('insurers').select('id, name').ilike('name', '%Chubb%');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('CHUBB_ID_RESULTS:', JSON.stringify(data));
}

checkInsurers();
