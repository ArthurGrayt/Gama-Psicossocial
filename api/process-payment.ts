import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS Setup
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { customer, billingType, cardData, value } = req.body;
    const apiKey = process.env.ASAAS_API_KEY;
    const apiUrl = process.env.ASAAS_API_URL;

    if (!apiKey || !apiUrl) return res.status(500).json({ error: 'Server config error' });

    try {
        // 1. Criar Cliente
        const customerReq = await fetch(`${apiUrl}/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'access_token': apiKey },
            body: JSON.stringify(customer)
        });
        const customerRes = await customerReq.json();
        if (customerRes.errors) throw new Error(customerRes.errors[0].description);

        // 2. Criar Pagamento
        const payload: any = {
            customer: customerRes.id,
            billingType,
            value,
            dueDate: new Date().toISOString().split('T')[0],
        };

        if (billingType === 'CREDIT_CARD') {
            payload.creditCard = cardData;
            payload.creditCardHolderInfo = {
                name: customer.name,
                email: customer.email,
                cpfCnpj: customer.cpfCnpj,
                postalCode: cardData.postalCode,
                addressNumber: cardData.addressNumber,
                phone: customer.mobilePhone
            };
        }

        const payReq = await fetch(`${apiUrl}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'access_token': apiKey },
            body: JSON.stringify(payload)
        });
        const payRes = await payReq.json();

        if (payRes.errors) throw new Error(payRes.errors[0].description);

        return res.status(200).json(payRes);

    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}