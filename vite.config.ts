
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Função auxiliar para ler .env manualmente se o loadEnv falhar
function manualLoadEnv(cwd: string) {
  const envPath = path.resolve(cwd, '.env');
  const env: Record<string, string> = {};

  if (fs.existsSync(envPath)) {
    console.log(`[Vite Manual Load] Lendo .env manualmente de: ${envPath}`);
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...rest] = trimmed.split('=');
        let value = rest.join('=');
        // Remove aspas se existirem
        if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
          value = value.substring(1, value.length - 1);
        }
        env[key.trim()] = value;
      }
    });
  }
  return env;
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Tenta carregar padrão
  const standardEnv = loadEnv(mode, process.cwd(), '');
  // Carrega manual como fallback/override
  const manualEnv = manualLoadEnv(process.cwd());

  // Combina, dando preferência ao manual para a chave problemática se o padrão falhar
  const env = { ...standardEnv, ...manualEnv };
  // Garante que a chave manual prevaleça se a standard estiver vazia ou quebrada
  if (!env.ASAAS_API_KEY && manualEnv.ASAAS_API_KEY) {
    env.ASAAS_API_KEY = manualEnv.ASAAS_API_KEY;
  }

  const timestamp = new Date().toISOString();
  console.log(`\n\n[${timestamp}] 🔍 VITE CONFIG RELOADED (ROBUST MODE)`);
  console.log(`[${timestamp}] 🔑 ASAAS_API_KEY check:`);

  if (env.ASAAS_API_KEY) {
    console.log(`   ✅ Key found. Length: ${env.ASAAS_API_KEY.length}`);
    console.log(`   🔑 Starts with: ${env.ASAAS_API_KEY.substring(0, 7)}...`);
  } else {
    console.log('   ❌ ASAAS_API_KEY is falsy (undefined or empty) even after manual load.');
  }

  return {
    plugins: [
      react(),
      {
        name: 'local-payment-api',
        configureServer(server) {
          server.middlewares.use('/api/process-payment', async (req, res, next) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });

              req.on('end', async () => {
                try {
                  const { customer, billingType, value, description } = JSON.parse(body);

                  // Usa o env capturado no escopo
                  const apiKey = env.ASAAS_API_KEY;
                  const apiUrl = env.ASAAS_API_URL || 'https://api-sandbox.asaas.com/v3';

                  if (!apiKey) {
                    console.error('[API Error] API Key missing.');
                    throw new Error('Chaves de API (ASAAS) não configuradas no .env local (Falha na leitura).');
                  }

                  // 1. BUSCAR OU CRIAR CLIENTE
                  let customerId = '';
                  const { data: { data: existingCustomers } } = await axios.get(
                    `${apiUrl}/customers?cpfCnpj=${customer.cpfCnpj}`,
                    { headers: { access_token: apiKey } }
                  );

                  if (existingCustomers && existingCustomers.length > 0) {
                    customerId = existingCustomers[0].id;
                  } else {
                    const { data: newCustomer } = await axios.post(
                      `${apiUrl}/customers`,
                      {
                        name: customer.name,
                        email: customer.email,
                        cpfCnpj: customer.cpfCnpj,
                        mobilePhone: customer.mobilePhone
                      },
                      { headers: { access_token: apiKey } }
                    );
                    customerId = newCustomer.id;
                  }

                  // 2. CRIAR COBRANÇA
                  const payload = {
                    customer: customerId,
                    billingType,
                    value: Number(value),
                    dueDate: new Date().toISOString().split('T')[0],
                    description: description || 'Compra via Vite Local',
                  };

                  const { data: paymentData } = await axios.post(
                    `${apiUrl}/payments`,
                    payload,
                    { headers: { access_token: apiKey } }
                  );

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    id: paymentData.id,
                    invoiceUrl: paymentData.invoiceUrl,
                    value: paymentData.value,
                    bankSlipUrl: paymentData.bankSlipUrl,
                    pixQrCode: paymentData.pixQrCode || null
                  }));

                } catch (error: any) {
                  console.error('[Vite API Error]', error.response?.data || error.message);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    error: 'Falha no servidor local (Vite).',
                    details: error.response?.data?.errors?.[0]?.description || error.message
                  }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
  };
});
