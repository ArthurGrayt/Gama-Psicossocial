import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import nodemailer from 'nodemailer';

// --- CONFIGURAÇÃO E CHECAGEM DE AMBIENTE ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. MODO NAVEGADOR (GET) - Para você testar se está online
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
  const { event, payment } = req.body || {}; // O "|| {}" impede o crash se vier vazio

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
    
    // A. Buscar Email do Cliente
    const asaasUrl = process.env.ASAAS_API_URL || 'https://api-sandbox.asaas.com/v3';
    const asaasKey = process.env.ASAAS_API_KEY;

    const customerResponse = await axios.get(`${asaasUrl}/customers/${payment.customer}`, {
      headers: { access_token: asaasKey }
    });
    
    const userEmail = customerResponse.data.email;
    const userName = customerResponse.data.name || 'Usuário Gama';

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
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === userEmail);

    let userIdStr = '';
    let isNewUser = false;
    let userPassword = ''; // Gerador simples de senha
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

      // Criar na tabela pública
      await supabase.from('users').upsert({
        user_id: userIdStr,
        email: userEmail,
        username: userName,
        tokens: 0,
        subscription_status: 'free'
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

    // F. Enviar Email (Se novo)
    if (isNewUser) {
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: userEmail,
            subject: 'Acesso Liberado! Gama Psicossocial 🔑',
            html: `<h2>Bem-vindo!</h2><p>Login: ${userEmail}</p><p>Senha: ${userPassword}</p>`,
        });
    }

    // G. Log de Sucesso na tabela (Opcional, mas útil)
    await supabase.from('webhook_logs').insert({
      status: 'sucesso',
      message: `Processado para ${userEmail}`,
      payload: payment
    });

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('❌ Erro Fatal:', error);
    
    // Log do erro no banco para debug (CORRIGIDO: Sem .catch)
    if (supabaseUrl && supabaseServiceKey) {
       // O Supabase v2 não joga exceção, ele retorna { error }, então não precisa de .catch
       await supabase.from('webhook_logs').insert({
          status: 'erro',
          message: error.message || 'Erro desconhecido',
          payload: { stack: error.stack }
       });
    }
    
    return res.status(500).json({ error: error.message });
  }
}