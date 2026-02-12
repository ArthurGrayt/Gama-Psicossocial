
const https = require('https');

const SUPABASE_URL = 'https://cmworeyixahfymfttazw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtd29yZXlpeGFoZnltZnR0YXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDI0NTAsImV4cCI6MjA4NTY3ODQ1MH0.vBMGiRObJH90eR86V9n-iefycSB1y400GO8db19CrC4';

const options = {
    hostname: 'cmworeyixahfymfttazw.supabase.co',
    path: '/rest/v1/vw_dashboard_ranking_geral?select=*&limit=5',
    method: 'GET',
    headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('BODY: ' + data);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
