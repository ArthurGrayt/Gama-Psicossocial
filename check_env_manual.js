
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
console.log('Checking .env at:', envPath);

if (fs.existsSync(envPath)) {
    console.log('File exists.');
    const content = fs.readFileSync(envPath, 'utf-8');
    console.log('File length:', content.length);

    // Simple manual parsing for demo
    const lines = content.split('\n');
    let apiKeyFound = false;

    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('ASAAS_API_KEY=')) {
            apiKeyFound = true;
            const value = trimmed.split('=')[1];
            console.log('✅ ASAAS_API_KEY found in .env');
            console.log('Raw value starts with:', value.substring(0, 5));

            // Remove quotes if present
            let cleanValue = value;
            if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
                cleanValue = value.substring(1, value.length - 1);
            }

            console.log('Clean value starts with:', cleanValue.substring(0, 5));
            if (cleanValue.startsWith('$')) {
                console.log('⚠️ Starts with $ - verify if this is expected.');
            }
        }
    });

    if (!apiKeyFound) {
        console.log('❌ ASAAS_API_KEY NOT found in .env via manual parse.');
    }

} else {
    console.log('❌ .env file does not exist at expected path.');
}
