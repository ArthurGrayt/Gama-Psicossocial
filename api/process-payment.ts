import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // --- Configuração CORS (Permitir que o Frontend acesse) ---
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // --- Recebendo dados do Frontend ---
    // IMPORTANTE: Adicionei 'description' aqui para sabermos qual é o plano
    const { customer, billingType, value, description } = req.body;

    const apiKey = process.env.ASAAS_API_KEY;
    const apiUrl = process.env.ASAAS_API_URL; // Ex: https://api-sandbox.asaas.com/v3

    if (!apiKey || !apiUrl) {
        return res.status(500).json({ error: 'Configuração de API (Chaves) não encontrada.' });
    }

    try {
        // 1. BUSCAR OU CRIAR CLIENTE (Estratégia Inteligente)
        // Primeiro tentamos achar pelo CPF para não dar erro de duplicação
        let customerId = '';

        const { data: { data: existingCustomers } } = await axios.get(
            `${apiUrl}/customers?cpfCnpj=${customer.cpfCnpj}`,
            { headers: { access_token: apiKey } }
        );

        if (existingCustomers && existingCustomers.length > 0) {
            // Cliente já existe, usamos o ID dele
            customerId = existingCustomers[0].id;
            console.log(`👤 Cliente encontrado: ${customerId}`);
        } else {
            // Cliente novo, criamos
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
            console.log(`🆕 Novo cliente criado: ${customerId}`);
        }

        // 2. CRIAR A COBRANÇA
        const payload: any = {
            customer: customerId,
            billingType: billingType, // 'PIX' ou 'BOLETO' ou 'CREDIT_CARD'
            value: Number(value),
            dueDate: new Date().toISOString().split('T')[0], // Vence hoje
            description: description || 'Compra de Créditos Gama', // ESSENCIAL PRO WEBHOOK
        };

        // Log para debug
        console.log('🚀 Enviando pagamento para Asaas:', payload);

        const { data: paymentData } = await axios.post(
            `${apiUrl}/payments`,
            payload,
            { headers: { access_token: apiKey } }
        );

        // 3. SUCESSO! Retorna os dados para o Frontend
        return res.status(200).json({
            id: paymentData.id,
            invoiceUrl: paymentData.invoiceUrl,
            value: paymentData.value,
            pixQrCode: paymentData.pixQrCode || null // Caso precise exibir QR Code direto
        });

    } catch (error: any) {
        // Tratamento de erro detalhado para você saber o que houve
        console.error('❌ Erro no pagamento:', error.response?.data || error.message);

        const errorMessage = error.response?.data?.errors?.[0]?.description || error.message;

        return res.status(500).json({
            error: 'Falha ao processar pagamento.',
            details: errorMessage
        });
    }
}