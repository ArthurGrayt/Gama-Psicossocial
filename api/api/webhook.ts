import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Segurança: Só aceita POST do Asaas
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 2. Pegar o evento que o Asaas mandou
    const { event, payment } = req.body;

    // 3. Verificar se é o evento que queremos (Pagamento Confirmado)
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {

        console.log(`🤑 PAGAMENTO RECEBIDO!`);
        console.log(`Cliente: ${payment.customer}`);
        console.log(`Valor: R$ ${payment.value}`);
        console.log(`ID do Pagamento: ${payment.id}`);

        // -------------------------------------------------------
        // AQUI É ONDE A MÁGICA ACONTECE
        // É aqui que você vai colocar o código para liberar o curso no seu Banco de Dados.
        // Exemplo: await supabase.from('users').update({ status: 'ativo' })...
        // -------------------------------------------------------

        return res.status(200).json({ received: true });
    }

    // Se for outro evento (ex: pagamento criado, vencido), a gente só ignora
    return res.status(200).json({ received: true });
}