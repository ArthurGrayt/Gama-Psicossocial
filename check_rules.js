
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cmworeyixahfymfttazw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtd29yZXlpeGFoZnltZnR0YXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDI0NTAsImV4cCI6MjA4NTY3ODQ1MH0.vBMGiRObJH90eR86V9n-iefycSB1y400GO8db19CrC4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase
        .from('form_hse_rules')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching data:', error);
    } else if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
        console.log('Sample row:', JSON.stringify(data[0], null, 2));
    } else {
        console.log('No data found in form_hse_rules');
    }
}

checkSchema();
