import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import nodemailer from 'nodemailer';

// --- CONFIGURAÇÃO E CHECAGEM DE AMBIENTE ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. MODO NAVEGADOR (GET) - Health Check
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'Online 🟢',
      message: 'O Webhook está rodando!',
      checks: {
        supabaseUrl: !!supabaseUrl ? 'OK' : 'Faltando ❌',
        supabaseKey: !!supabaseServiceKey ? 'OK' : 'Faltando ❌',
        smtpHost: !!process.env.SMTP_HOST ? 'OK' : 'Faltando ❌',
        smtpUser: !!process.env.SMTP_USER ? 'OK' : 'Faltando ❌'
      }
    });
  }

  // 2. Validação de Segurança das Chaves
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ ERRO CRÍTICO: Variáveis de ambiente do Supabase não configuradas.');
    return res.status(500).json({ error: 'Configuração do Servidor Incompleta (Env Vars).' });
  }

  // Inicializa Supabase
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Configuração do E-mail
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // 3. Recebimento do Webhook (POST)
  const { event, payment } = req.body || {};

  if (!event || !payment) {
    return res.status(400).json({ error: 'Payload inválido ou vazio.' });
  }

  // Só processa pagamento recebido
  if (event !== 'PAYMENT_RECEIVED') {
    return res.status(200).json({ received: true, ignored: true });
  }

  try {
    console.log(`💰 Processando pagamento: ${payment.id}`);

    // --- LÓGICA DE NEGÓCIO ---

    // A. Buscar Email do Cliente no Asaas
    const asaasUrl = process.env.ASAAS_API_URL || 'https://api-sandbox.asaas.com/v3';
    const asaasKey = process.env.ASAAS_API_KEY;

    const customerResponse = await axios.get(`${asaasUrl}/customers/${payment.customer}`, {
      headers: { access_token: asaasKey }
    });

    const userEmail = customerResponse.data.email;
    const userName = customerResponse.data.name || 'Usuário Gama';

    // B. Regras de Tokens e Plano
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
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === userEmail);

    let userIdStr = '';
    let isNewUser = false;
    let userPassword = '';
    const generatePassword = () => Math.random().toString(36).slice(-10) + "Aa1!";

    if (existingUser) {
      userIdStr = existingUser.id;
    } else {
      isNewUser = true;
      userPassword = generatePassword();

      // Criar no Auth
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: userEmail,
        password: userPassword,
        email_confirm: true,
        user_metadata: { name: userName }
      });

      if (createError) throw createError;
      userIdStr = newUser.user.id;

      // Criar na tabela pública (COM PRIMEIRO ACESSO = TRUE)
      await supabase.from('users').upsert({
        user_id: userIdStr,
        email: userEmail,
        username: userName,
        tokens: 0,
        subscription_status: 'free',
        primeiro_acesso: true // <--- Garante o fluxo de troca de senha
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

    // F. Enviar Email (Se novo) - COM SEU HTML PERSONALIZADO 🎨
    if (isNewUser) {
      // Variáveis visuais
      const platformUrl = "https://gama-psicossocial.vercel.app"; // Link da sua plataforma
      const logoUrl = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"; // Troque pelo link da sua logo real

      const emailHtml = `
        <!DOCTYPE html>
        <html lang="pt-BR"><head>
        <meta charset="utf-8"/>
        <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
        <title>Email de Confirmação - Gama Psicossocial</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
        <script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
        <script>
                tailwind.config = {
                    darkMode: "class",
                    theme: {
                        extend: {
                            colors: {
                                primary: "#0047FF", // Azul Gama
                                secondary: "#1F2D40",
                                "background-light": "#F3F5F9",
                                "background-dark": "#0F172A",
                                "card-light": "#FFFFFF",
                                "card-dark": "#1E293B",
                                "block-bg-light": "#F8FAFC",
                                "block-bg-dark": "#334155",
                                "text-subtle-light": "#64748B",
                                "text-subtle-dark": "#94A3B8",
                                "text-main-light": "#334155",
                                "text-main-dark": "#E2E8F0",
                            },
                            fontFamily: {
                                display: ["Inter", "sans-serif"],
                            },
                        },
                    },
                };
            </script>
        </head>
        <body class="bg-background-light dark:bg-background-dark font-display min-h-screen flex items-center justify-center p-4 transition-colors duration-300">
        <div class="w-full max-w-2xl bg-card-light dark:bg-card-dark rounded-2xl shadow-soft dark:shadow-none overflow-hidden border border-transparent dark:border-gray-700 transition-colors duration-300">
        <div class="p-10 pb-8">
        <div class="flex justify-center mb-8">
        <div class="w-16 h-16 flex items-center justify-center">
        <img alt="Logo Gama" class="w-14 h-14 rounded-xl shadow-sm" src="${logoUrl}"/>
        </div>
        </div>
        <div class="text-center mb-10">
        <h1 class="text-3xl font-bold text-secondary dark:text-white mb-3">
            Bem-vindo(a), ${userName}! 👋
        </h1>
        <p class="text-text-subtle-light dark:text-text-subtle-dark text-base leading-relaxed">
            Seu pagamento foi confirmado. Seu acesso à plataforma está liberado.
        </p>
        </div>
        <div class="space-y-4 max-w-xl mx-auto">
        
        <div class="bg-block-bg-light dark:bg-block-bg-dark rounded-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 text-center sm:text-left">
        <span class="text-sm font-bold text-text-subtle-light dark:text-gray-300 uppercase tracking-wide whitespace-nowrap">
                Seu E-mail de Acesso:
        </span>
        <span class="text-base font-medium text-text-main-light dark:text-white select-all">
                ${userEmail}
        </span>
        </div>

        <div class="bg-block-bg-light dark:bg-block-bg-dark rounded-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 text-center sm:text-left">
        <span class="text-sm font-bold text-text-subtle-light dark:text-gray-300 uppercase tracking-wide whitespace-nowrap">
                Sua Senha Temporária:
        </span>
        <span class="text-base font-mono font-medium text-text-main-light dark:text-white tracking-wider select-all">
                ${userPassword}
        </span>
        </div>

        <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/50 rounded-lg p-4 flex items-start gap-3 mt-4">
        <span style="font-size: 20px;">⚠️</span>
        <p class="text-sm text-yellow-700 dark:text-yellow-200 leading-snug">
        <strong>Importante:</strong> Por segurança, você será solicitado a criar uma nova senha assim que entrar.
        </p>
        </div>
        <div class="pt-2">
        <a href="${platformUrl}" style="text-decoration: none;">
            <button class="w-full bg-primary hover:bg-[#259ab0] text-white font-semibold py-4 rounded-xl shadow-md hover:shadow-lg transform active:scale-[0.98] transition-all duration-200 text-lg">
                Acessar Plataforma
            </button>
        </a>
        </div>
        </div>
        </div>
        <div class="bg-gray-50 dark:bg-[#16202e] py-6 px-8 text-center border-t border-gray-100 dark:border-gray-700">
        <p class="text-sm text-text-subtle-light dark:text-text-subtle-dark">
            Precisa de ajuda? <a class="text-primary font-semibold hover:underline" href="#">Fale com o suporte</a>
        </p>
        </div>
        </div>
        </body></html>
        `;

      await transporter.sendMail({
        from: `"Gama Psicossocial" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: '🚀 Seu Acesso Chegou! - Gama Psicossocial',
        html: emailHtml,
      });
    }

    // G. Log de Sucesso na tabela
    await supabase.from('webhook_logs').insert({
      status: 'sucesso',
      message: `Processado para ${userEmail}`,
      payload: payment
    });

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('❌ Erro Fatal:', error);
    if (supabaseUrl && supabaseServiceKey) {
      await supabase.from('webhook_logs').insert({
        status: 'erro',
        message: error.message || 'Erro desconhecido',
        payload: { stack: error.stack }
      });
    }
    return res.status(500).json({ error: error.message });
  }
}