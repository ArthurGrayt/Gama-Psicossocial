
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
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
  console.log('[Vite Config] SUPABASE_SERVICE_ROLE_KEY exists:', !!env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('[Vite Config] SMTP_HOST exists:', !!env.SMTP_HOST);

  return {
    plugins: [
      react(),
      {
        name: 'local-api-payment-middleware',
        configureServer(server) {
          // Middleware 1: Processar Pagamento
          server.middlewares.use('/api/process-payment', async (req: any, res: any, next: any) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            console.log('[API Local] Middleware processando requisição...');

            try {
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

              if (!payload.customer || !payload.billingType || !payload.value) {
                console.error('[API Local] Dados incompletos:', payload);
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing required fields' }));
                return;
              }

              const asaasUrl = env.ASAAS_API_URL || 'https://api-sandbox.asaas.com/v3';
              const asaasKey = env.ASAAS_API_KEY;

              if (!asaasKey) {
                console.error('[API Local] ASAAS_API_KEY não definida no .env');
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Server configuration error: ASAAS_API_KEY missing' }));
                return;
              }

              console.log(`[API Local] Enviando para Asaas: ${asaasUrl}/payments`);

              const response = await axios.post(`${asaasUrl}/payments`, payload, {
                headers: {
                  'Content-Type': 'application/json',
                  'access_token': asaasKey
                }
              });

              console.log('[API Local] Sucesso Asaas:', response.data);

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

          // Middleware 2: Simular Webhook (Cria Usuário + Envia Email)
          server.middlewares.use('/api/webhook-simulation', async (req: any, res: any, next: any) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            console.log('[Webhook Sim] Recebendo requisição de simulação...');

            try {
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
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
                return;
              }

              const { payment } = payload;
              if (!payment) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing payment data' }));
                return;
              }

              // LÓGICA DO WEBHOOK AQUI
              const supabaseUrl = env.VITE_SUPABASE_URL;
              const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

              if (!supabaseUrl || !supabaseServiceKey) {
                console.error('[Webhook Sim] Faltam chaves do Supabase (SERVICE_ROLE_KEY)');
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Missing Supabase Configuration' }));
                return;
              }

              const supabase = createClient(supabaseUrl, supabaseServiceKey, {
                auth: { autoRefreshToken: false, persistSession: false }
              });

              // Configuração do E-mail
              if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
                console.error('[Webhook Sim] Faltam configurações de SMTP');
                // Não retorna erro fatal, tenta seguir sem email
              }

              const transporter = nodemailer.createTransport({
                host: env.SMTP_HOST,
                port: Number(env.SMTP_PORT) || 587,
                secure: Number(env.SMTP_PORT) === 465,
                auth: {
                  user: env.SMTP_USER,
                  pass: env.SMTP_PASS,
                },
              });

              console.log(`[Webhook Sim] Processando pagamento: ${payment.id}`);
              const asaasKey = env.ASAAS_API_KEY;
              const asaasUrl = env.ASAAS_API_URL || 'https://api-sandbox.asaas.com/v3';

              // A. Buscar Customer para pegar email
              const customerResponse = await axios.get(`${asaasUrl}/customers/${payment.customer}`, {
                headers: { access_token: asaasKey }
              });

              const userEmail = customerResponse.data.email;
              const userName = customerResponse.data.name || 'Usuário Gama';
              console.log(`[Webhook Sim] Cliente identificado: ${userEmail}`);

              // B. Regras de Tokens
              let tokensToAdd = 0;
              let planType = 'avulso';
              let diasAssinatura = 0;
              const description = payment.description ? payment.description.toLowerCase() : '';
              const valor = payment.value;

              if (description.includes('mensal')) {
                tokensToAdd = 100; planType = 'mensal'; diasAssinatura = 30;
              } else if (description.includes('semestral')) {
                tokensToAdd = 700; planType = 'semestral'; diasAssinatura = 180;
              } else if (description.includes('anual')) {
                tokensToAdd = 1500; planType = 'anual'; diasAssinatura = 365;
              } else {
                tokensToAdd = Math.floor(valor * 1);
                planType = 'pacote_extra';
              }

              // C. Supabase: Buscar ou Criar Usuário
              // NOTA: listUsers só funciona com service_role key
              const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
              if (listError) throw listError;

              const existingUser = (users as any[]).find(u => u.email === userEmail);

              let userIdStr = '';
              let isNewUser = false;
              let userPassword = '';
              // Senha forte gerada
              const generatePassword = () => Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + "1!";

              if (existingUser) {
                userIdStr = existingUser.id;
                console.log(`[Webhook Sim] Usuário já existe: ${userIdStr}`);
              } else {
                isNewUser = true;
                userPassword = generatePassword();
                console.log(`[Webhook Sim] Criando novo usuário... Senha: ${userPassword}`);

                // Criar no Auth
                const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                  email: userEmail,
                  password: userPassword,
                  email_confirm: true,
                  user_metadata: { name: userName }
                });

                if (createError) throw createError;
                userIdStr = newUser.user.id;

                // Criar na tabela pública
                await supabase.from('users').upsert({
                  user_id: userIdStr,
                  email: userEmail,
                  username: userName,
                  tokens: 0,
                  subscription_status: 'free',
                  primeiro_acesso: true
                }, { onConflict: 'user_id' });
              }

              // D. Atualizar Saldo
              const { data: publicUser } = await supabase
                .from('users')
                .select('*')
                .eq('user_id', userIdStr)
                .single();

              const currentTokens = publicUser?.tokens || 0;
              const now = new Date();
              let newEndDate = publicUser?.subscription_end_date ? new Date(publicUser.subscription_end_date) : new Date();
              if (newEndDate < now) newEndDate = now;
              if (diasAssinatura > 0) newEndDate.setDate(newEndDate.getDate() + diasAssinatura);

              await supabase.from('users').update({
                tokens: currentTokens + tokensToAdd,
                subscription_status: 'active',
                subscription_plan: planType,
                subscription_start_date: now.toISOString(),
                subscription_end_date: newEndDate.toISOString()
              }).eq('user_id', userIdStr);

              console.log(`[Webhook Sim] Saldo atualizado. Tokens adicionados: ${tokensToAdd}`);

              // E. Histórico
              if (publicUser?.id) {
                await supabase.from('payment_history').insert({
                  user_id: publicUser.id,
                  email: userEmail,
                  asaas_payment_id: payment.id,
                  amount_paid: valor,
                  tokens_added: tokensToAdd,
                  plan_type: planType,
                  status: 'approved'
                });
              }

              // F. Enviar Email
              if (isNewUser && env.SMTP_HOST) {
                console.log('[Webhook Sim] Enviando e-mail de boas-vindas...');
                const platformUrl = "https://gama-psicossocial.vercel.app";
                const emailHtml = `
                    <h1>Bem-vindo(a), ${userName}!</h1>
                    <p>Seu pagamento foi confirmado.</p>
                    <p><strong>Email:</strong> ${userEmail}</p>
                    <p><strong>Senha:</strong> ${userPassword}</p>
                    <p><a href="${platformUrl}">Acessar Plataforma</a></p>
                    `; // Simplificado para brevidade no vite config, mas funcional

                await transporter.sendMail({
                  from: `"Gama Psicossocial" <${env.SMTP_USER}>`,
                  to: userEmail,
                  subject: '🚀 Seu Acesso Chegou! - Gama Psicossocial',
                  html: emailHtml,
                });
                console.log('[Webhook Sim] E-mail enviado com sucesso!');
              } else if (isNewUser) {
                console.log('[Webhook Sim] E-mail NÃO enviado (SMTP não configurado). Senha gerada: ' + userPassword);
              }

              // G. Log de Sucesso na tabela
              await supabase.from('webhook_logs').insert({
                status: 'sucesso_simulado',
                message: `Simulação Local: Processado para ${userEmail}`,
                payload: payment
              });

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Webhook simulated successfully' }));

            } catch (error: any) {
              console.error('[Webhook Sim] Erro:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          });
        }
      }
    ]
  };
});
