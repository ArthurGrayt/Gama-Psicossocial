
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    const { data, error } = await supabase
        .from('form_hse_rules')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error fetching data:', error)
    } else if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]))
        console.log('Sample row:', JSON.stringify(data[0], null, 2))
    } else {
        console.log('No data found in form_hse_rules')
    }
}

checkSchema()
