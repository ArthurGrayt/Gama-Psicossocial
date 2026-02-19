
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 0. CONFIGURAÇÃO DE CORS E SEGURANÇA BÁSICA
    // Isso deve ser a primeira coisa para garantir que o cliente receba a resposta
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Responde OPTIONS imediatamente
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        console.log('[API PROD] Recebendo requisição (v2 - ESM Check)...');

        // 1. VALIDAÇÃO DE MÉTODO E BODY
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        const body = req.body;
        if (!body) {
            console.error('[API PROD] Erro: Body vazio ou não parseado.');
            return res.status(400).json({ error: 'Request body is empty or invalid JSON' });
        }

        // --- Recebendo dados do Frontend ---
        const { customer, billingType, value, description } = body;

        // 2. VALIDAÇÃO DE CONFIGURAÇÃO (ENV VARS)
        const apiKey = process.env.ASAAS_API_KEY;
        const apiUrl = process.env.ASAAS_API_URL; // Ex: https://api-sandbox.asaas.com/v3

        if (!apiKey || !apiUrl) {
            console.error('[API PROD] Erro: Variáveis de ambiente faltando.');
            console.error('[API PROD] ASAAS_API_URL:', apiUrl);
            // NÃO logar a key inteira por segurança, apenas se existe
            console.error('[API PROD] ASAAS_API_KEY exists:', !!apiKey);

            return res.status(500).json({
                error: 'Server Misconfiguration: Environment variables missing.',
                details: 'Verifique ASAAS_API_URL e ASAAS_API_KEY no painel da Vercel.'
            });
        }

        // 3. VALIDAÇÃO DE DADOS MÍNIMOS
        if (!customer || !billingType || !value) {
            console.error('[API PROD] Dados incompletos:', body);
            return res.status(400).json({ error: 'Missing required fields (customer, billingType, value)' });
        }

        // 4. LÓGICA DE NEGÓCIO (Busca/Cria Cliente + Pagamento)

        // A. BUSCAR OU CRIAR CLIENTE
        let customerId = '';

        try {
            console.log(`[API PROD] Consultando cliente CPF: ${customer.cpfCnpj}`);
            const { data: { data: existingCustomers } } = await axios.get(
                `${apiUrl}/customers?cpfCnpj=${customer.cpfCnpj}`,
                { headers: { access_token: apiKey } }
            );

            if (existingCustomers && existingCustomers.length > 0) {
                customerId = existingCustomers[0].id;
                console.log(`[API PROD] Cliente encontrado: ${customerId}`);
            } else {
                console.log(`[API PROD] Criando novo cliente...`);
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
                console.log(`[API PROD] Novo cliente criado: ${customerId}`);
            }
        } catch (customerError: any) {
            console.error('[API PROD] Erro ao buscar/criar cliente:', customerError.message);
            if (customerError.response) {
                console.error('[API PROD] Detalhes Asaas:', customerError.response.data);
                return res.status(customerError.response.status).json({
                    error: 'Erro Asaas (Cliente)',
                    details: customerError.response.data
                });
            }
            throw customerError; // Joga pro catch global
        }

        // B. CRIAR A COBRANÇA
        const payload: any = {
            customer: customerId,
            billingType: billingType,
            value: Number(value),
            dueDate: new Date().toISOString().split('T')[0], // Vence hoje
            description: description || 'Compra de Créditos Gama',
        };

        console.log('[API PROD] Enviando pagamento para Asaas:', payload);

        const { data: paymentData } = await axios.post(
            `${apiUrl}/payments`,
            payload,
            { headers: { access_token: apiKey } }
        );

        console.log('[API PROD] Sucesso pagamento:', paymentData.id);

        // 5. SUCESSO!
        return res.status(200).json({
            id: paymentData.id,
            invoiceUrl: paymentData.invoiceUrl,
            value: paymentData.value,
            pixQrCode: paymentData.pixQrCode || null,
            bankSlipUrl: paymentData.bankSlipUrl || null
        });

    } catch (error: any) {
        // CATCH GLOBAL PARA EVITAR O 500 GENÉRICO ("A server error has occurred")
        console.error('[API PROD] ERRO FATAL:', error);

        const status = error.response?.status || 500;
        const message = error.response?.data || error.message || 'Erro desconhecido no servidor';

        // Garante que SEMPRE retorna JSON
        return res.status(status).json({
            error: 'Internal Server Error',
            details: message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}