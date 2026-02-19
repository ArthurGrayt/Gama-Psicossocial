
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env');
console.log('Checking .env at:', envPath);

if (fs.existsSync(envPath)) {
    console.log('File exists.');
    const envConfig = dotenv.parse(fs.readFileSync(envPath));

    if (envConfig.ASAAS_API_KEY) {
        console.log('✅ ASAAS_API_KEY found in .env');
        console.log('Value length:', envConfig.ASAAS_API_KEY.length);
        console.log('Starts with:', envConfig.ASAAS_API_KEY.substring(0, 5));
    } else {
        console.log('❌ ASAAS_API_KEY NOT found in .env');
    }

    if (envConfig.ASAAS_API_URL) {
        console.log('✅ ASAAS_API_URL found in .env:', envConfig.ASAAS_API_URL);
    } else {
        console.log('❌ ASAAS_API_URL NOT found in .env');
    }

} else {
    console.log('❌ .env file does not exist at expected path.');
}
