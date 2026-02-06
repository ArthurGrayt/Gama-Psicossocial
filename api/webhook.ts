import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import nodemailer from 'nodemailer';

// --- CONFIGURAÇÕES ---
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// IMPORTANTE: Configurações extras para garantir que a chave de ADM funcione sem RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
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

function generatePassword(length = 10) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

// Função auxiliar para gravar log no banco
async function logToDb(status: string, message: string, payload: any = {}) {
    try {
        await supabase.from('webhook_logs').insert({
            status,
            message,
            payload: payload
        });
    } catch (e) {
        console.error('Erro ao gravar log:', e);
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { event, payment } = req.body;

    // 1. Log inicial: O Asaas bateu na porta?
    if (event === 'PAYMENT_RECEIVED') {
        await logToDb('info', `Recebi aviso de pagamento ID: ${payment.id}`, req.body);
    } else {
        return res.status(200).json({ received: true });
    }

    try {
        // 2. Buscar Email do Cliente
        const asaasUrl = process.env.ASAAS_API_URL || 'https://api-sandbox.asaas.com/v3';
        const asaasKey = process.env.ASAAS_API_KEY;

        const customerResponse = await axios.get(`${asaasUrl}/customers/${payment.customer}`, {
            headers: { access_token: asaasKey }
        });

        const userEmail = customerResponse.data.email;
        const userName = customerResponse.data.name || 'Usuário Gama'; // Evita erro se nome for null

        await logToDb('info', `Cliente identificado: ${userEmail}`, { name: userName });

        // 3. Regras de Tokens
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

        // 4. Buscar ou Criar Usuário
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === userEmail);

        let userIdStr = '';
        let isNewUser = false;
        let userPassword = '';

        if (existingUser) {
            userIdStr = existingUser.id;
            await logToDb('info', `Usuário já existia no Auth: ${userIdStr}`);
        } else {
            isNewUser = true;
            userPassword = generatePassword(12);

            // Criar no Auth
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: userEmail,
                password: userPassword,
                email_confirm: true,
                user_metadata: { name: userName }
            });

            if (createError) throw createError;
            userIdStr = newUser.user.id;

            await logToDb('info', `Usuário criado no Auth: ${userIdStr}`);

            // Criar na tabela users
            const { error: insertError } = await supabase.from('users').upsert({
                user_id: userIdStr,
                email: userEmail,
                username: userName,
                tokens: 0,
                subscription_status: 'free'
            }, { onConflict: 'user_id' });

            if (insertError) {
                throw new Error(`Erro ao criar em public.users: ${insertError.message}`);
            }
        }

        // 5. Atualizar Dados do Usuário
        const { data: publicUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', userIdStr)
            .single();

        if (fetchError || !publicUser) throw new Error(`Usuário não encontrado na tabela pública: ${userIdStr}`);

        const currentTokens = publicUser.tokens || 0;
        const now = new Date();
        let newEndDate = publicUser.subscription_end_date ? new Date(publicUser.subscription_end_date) : new Date();
        if (newEndDate < now) newEndDate = now;
        if (diasAssinatura > 0) newEndDate.setDate(newEndDate.getDate() + diasAssinatura);

        const { error: updateError } = await supabase.from('users').update({
            tokens: currentTokens + tokensToAdd,
            subscription_status: 'active',
            subscription_plan: planType,
            subscription_start_date: now.toISOString(),
            subscription_end_date: newEndDate.toISOString()
        }).eq('user_id', userIdStr);

        if (updateError) throw new Error(`Erro ao atualizar tokens: ${updateError.message}`);

        // 6. Gravar Histórico
        await supabase.from('payment_history').insert({
            user_id: publicUser.id,
            email: userEmail,
            asaas_payment_id: payment.id,
            amount_paid: valor,
            tokens_added: tokensToAdd,
            plan_type: planType,
            status: 'approved'
        });

        await logToDb('sucesso', `Fluxo completo finalizado para ${userEmail}`);

        // 7. Enviar Email
        if (isNewUser) {
            const emailHtml = `
            <h2>Bem-vindo(a) ao Gama Psicossocial! 🚀</h2>
            <p>Seus dados de acesso:</p>
            <p><strong>Login:</strong> ${userEmail}</p>
            <p><strong>Senha:</strong> ${userPassword}</p>
        `;
            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: userEmail,
                subject: 'Acesso Liberado! 🔑',
                html: emailHtml,
            });
        }

        return res.status(200).json({ success: true });

    } catch (error: any) {
        // AQUI ESTÁ O SEGREDO: Gravar o erro no banco para lermos depois
        await logToDb('erro', `FALHA FATAL: ${error.message}`, { stack: error.stack });

        console.error('❌ Erro Fatal:', error);
        return res.status(500).json({ error: error.message });
    }
}