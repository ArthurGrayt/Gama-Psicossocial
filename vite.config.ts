
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Função auxiliar para ler .env manualmente se o loadEnv falhar ou não comportar como esperado
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
        value = value.trim();

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
  // Carrega as variáveis de ambiente baseadas no modo atual (development, production, etc.)
  const loadedEnv = loadEnv(mode, process.cwd(), '');
  const manuallyLoadedEnv = manualLoadEnv(process.cwd());

  // Merge das variáveis, priorizando o manual load para garantir que pegamos exatamente o que está no arquivo
  const env = { ...loadedEnv, ...manuallyLoadedEnv };

  console.log('[Vite Config] ASAAS_API_URL:', env.ASAAS_API_URL);
  console.log('[Vite Config] ASAAS_API_KEY exists:', !!env.ASAAS_API_KEY);
  if (env.ASAAS_API_KEY) {
    console.log('[Vite Config] ASAAS_API_KEY length:', env.ASAAS_API_KEY.length);
    console.log('[Vite Config] ASAAS_API_KEY start:', env.ASAAS_API_KEY.substring(0, 5) + '...');
  }

  return {
    plugins: [
      react(),
      {
        name: 'local-api-payment-middleware',
        configureServer(server) {
          // Middleware para interceptar POST em /api/process-payment
          // Usamos 'any' para evitar conflitos de tipagem do TypeScript com IncomingMessage/ServerResponse
          server.middlewares.use('/api/process-payment', async (req: any, res: any, next: any) => {

            // Verifica se é POST
            if (req.method !== 'POST') {
              // Se não for POST, podemos dar next() ou retornar 405. 
              // Como é uma rota específica de API, melhor retornar 405 Method Not Allowed se acessarem via GET
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            console.log('[API Local] Middleware processando requisição...');

            try {
              // 1. Ler o corpo da requisição (JSON)
              const body = await new Promise<string>((resolve, reject) => {
                let data = '';
                req.on('data', (chunk: any) => data += chunk);
                req.on('end', () => resolve(data));
                req.on('error', (err: any) => reject(err));
              });

              let payload: any;
              try {
                payload = JSON.parse(body);
              } catch (e) {
                console.error('[API Local] Erro ao fazer parse do JSON:', e);
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
                return;
              }

              // 2. Validar payload básico
              if (!payload.customer || !payload.billingType || !payload.value) {
                console.error('[API Local] Dados incompletos:', payload);
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing required fields' }));
                return;
              }

              // 3. Preparar requisição para o Asaas
              // Re-lê o env aqui dentro para garantir, mas teoricamente o do escopo externo já deveria funcionar.
              // Mas vamos usar o 'env' capturado no início do defineConfig
              const asaasUrl = env.ASAAS_API_URL || 'https://api-sandbox.asaas.com/v3';
              const asaasKey = env.ASAAS_API_KEY;

              if (!asaasKey) {
                console.error('[API Local] ASAAS_API_KEY não definida no .env');
                console.error('[API Local] Keys disponíveis:', Object.keys(env).filter(k => k.includes('ASAAS')));

                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Server configuration error: ASAAS_API_KEY missing' }));
                return;
              }

              console.log(`[API Local] Enviando para Asaas: ${asaasUrl}/payments`);

              // 4. Enviar para o Asaas
              const response = await axios.post(`${asaasUrl}/payments`, payload, {
                headers: {
                  'Content-Type': 'application/json',
                  'access_token': asaasKey
                }
              });

              console.log('[API Local] Sucesso Asaas:', response.data);

              // 5. Responder ao frontend
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(response.data));

            } catch (error: any) {
              console.error('[API Local] Erro na requisição Asaas:', error.message);
              const status = error.response ? (error.response.status || 500) : 500;
              const data = error.response ? error.response.data : { error: error.message };

              res.statusCode = status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            }
          });
        }
      }
    ]
  };
});
