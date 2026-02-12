
const https = require('https');

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtd29yZXlpeGFoZnltZnR0YXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDI0NTAsImV4cCI6MjA4NTY3ODQ1MH0.vBMGiRObJH90eR86V9n-iefycSB1y400GO8db19CrC4';

const options = {
    hostname: 'cmworeyixahfymfttazw.supabase.co',
    path: '/rest/v1/?apikey=' + SUPABASE_KEY,
    method: 'GET',
    headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
    }
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        // Parse JSON and look for the view definition
        try {
            const spec = JSON.parse(data);
            const viewDef = spec.definitions['vw_dashboard_ranking_geral'];
            console.log('View Definition:', JSON.stringify(viewDef, null, 2));
        } catch (e) {
            console.log('Error parsing JSON:', e.message);
            console.log('Raw Data:', data.substring(0, 500));
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
