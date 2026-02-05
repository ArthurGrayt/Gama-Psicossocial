import React, { useState } from 'react';
import { X, CreditCard, Wallet, QrCode, User, Mail, Phone, ShieldCheck, Zap, ArrowLeft, Check, Loader2 } from 'lucide-react';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedPackage: {
        id: string;
        name: string;
        tokens: number;
        price: string;
    } | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, selectedPackage }) => {
    const [paymentMethod, setPaymentMethod] = useState<'credit' | 'debit' | 'pix'>('pix');
    const [isLoading, setIsLoading] = useState(false);

    // Customer Info State
    const [customer, setCustomer] = useState({
        name: '',
        email: '',
        cpfCnpj: '',
        mobilePhone: ''
    });

    // Card Info State
    const [cardData, setCardData] = useState({
        holderName: '',
        number: '',
        expiryMonth: '',
        expiryYear: '',
        ccv: '',
        postalCode: '',
        addressNumber: ''
    });

    if (!isOpen || !selectedPackage) return null;

    const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCustomer(prev => ({ ...prev, [name]: value }));
    };

    const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCardData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            // Clean values (remove non-digits from CPF/CNPJ and Phone if needed)
            const cleanCpfCnpj = customer.cpfCnpj.replace(/\D/g, '');
            const cleanPhone = customer.mobilePhone.replace(/\D/g, '');
            const cleanValue = parseFloat(selectedPackage.price.replace(',', '.'));

            const body = {
                value: cleanValue,
                billingType: paymentMethod === 'pix' ? 'PIX' : 'CREDIT_CARD',
                customer: {
                    ...customer,
                    cpfCnpj: cleanCpfCnpj,
                    mobilePhone: cleanPhone
                },
                cardData: (paymentMethod === 'credit' || paymentMethod === 'debit') ? cardData : null
            };

            const response = await fetch('/api/process-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao processar pagamento');
            }

            // Success: Handle redirect
            if (data.invoiceUrl) {
                window.open(data.invoiceUrl, '_blank');
                onClose();
            } else if (data.bankSlipUrl) { // Fallback if it returns bankSlipUrl for Pix
                window.open(data.bankSlipUrl, '_blank');
                onClose();
            } else {
                alert('Pagamento gerado com sucesso! Verifique seu e-mail.');
                onClose();
            }

        } catch (error: any) {
            console.error('Payment Error:', error);
            alert(`Erro: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all duration-300 overflow-y-auto">
            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white rounded-[2rem] shadow-xl p-6 md:p-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-300 relative max-h-[95vh] overflow-y-auto custom-scrollbar">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-50 disabled:opacity-50"
                >
                    <X size={20} />
                </button>

                {/* Left Column: Checkout Form */}
                <div className="lg:col-span-8 flex flex-col h-full">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Finalizar Compra</h1>
                    <p className="text-slate-500 mb-8 text-sm">Escolha sua forma de pagamento abaixo</p>

                    {/* Payment Methods */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <button
                            disabled={isLoading}
                            onClick={() => setPaymentMethod('credit')}
                            className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all group ${paymentMethod === 'credit' ? 'border-[#35b6cf] bg-[#35b6cf]/5 shadow-sm' : 'border-slate-100 hover:bg-slate-50'} ${isLoading ? 'opacity-50' : ''}`}
                        >
                            <CreditCard className={`mb-2 transition-colors ${paymentMethod === 'credit' ? 'text-[#35b6cf]' : 'text-slate-400 group-hover:text-[#35b6cf]'}`} size={24} />
                            <span className={`text-sm font-medium transition-colors ${paymentMethod === 'credit' ? 'text-[#35b6cf]' : 'text-slate-500 group-hover:text-[#35b6cf]'}`}>Cartão de Crédito</span>
                        </button>

                        <button
                            disabled={isLoading}
                            onClick={() => setPaymentMethod('debit')}
                            className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all group ${paymentMethod === 'debit' ? 'border-[#35b6cf] bg-[#35b6cf]/5 shadow-sm' : 'border-slate-100 hover:bg-slate-50'} ${isLoading ? 'opacity-50' : ''}`}
                        >
                            <Wallet className={`mb-2 transition-colors ${paymentMethod === 'debit' ? 'text-[#35b6cf]' : 'text-slate-400 group-hover:text-[#35b6cf]'}`} size={24} />
                            <span className={`text-sm font-medium transition-colors ${paymentMethod === 'debit' ? 'text-[#35b6cf]' : 'text-slate-500 group-hover:text-[#35b6cf]'}`}>Cartão de Débito</span>
                        </button>

                        <button
                            disabled={isLoading}
                            onClick={() => setPaymentMethod('pix')}
                            className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${paymentMethod === 'pix' ? 'border-[#35b6cf] bg-[#35b6cf]/5 shadow-sm scale-[1.02]' : 'border-slate-100 hover:bg-slate-50'} ${isLoading ? 'opacity-50' : ''}`}
                        >
                            <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">INSTANTÂNEO</div>
                            <QrCode className="text-[#35b6cf] mb-2" size={24} />
                            <span className="text-sm font-bold text-[#35b6cf]">Pix</span>
                        </button>
                    </div>

                    <h2 className="text-lg font-semibold text-slate-800 mb-4 tracking-tight">Dados do Pagador</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="relative group col-span-1 md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="text"
                                    name="name"
                                    value={customer.name}
                                    onChange={handleCustomerChange}
                                    disabled={isLoading}
                                    placeholder="Como impresso no cartão"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] transition-all disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <div className="relative group">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">CPF/CNPJ</label>
                            <input
                                type="text"
                                name="cpfCnpj"
                                value={customer.cpfCnpj}
                                onChange={handleCustomerChange}
                                disabled={isLoading}
                                placeholder="000.000.000-00"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] transition-all disabled:opacity-50"
                            />
                        </div>

                        <div className="relative group">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Celular</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="tel"
                                    name="mobilePhone"
                                    value={customer.mobilePhone}
                                    onChange={handleCustomerChange}
                                    disabled={isLoading}
                                    placeholder="(00) 00000-0000"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] transition-all disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <div className="relative group col-span-1 md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="email"
                                    name="email"
                                    value={customer.email}
                                    onChange={handleCustomerChange}
                                    disabled={isLoading}
                                    placeholder="exemplo@email.com"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] transition-all disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* Card Data Section (only if credit or debit) */}
                        {paymentMethod !== 'pix' && (
                            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                                <div className="col-span-1 md:col-span-3 relative group">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Número do Cartão</label>
                                    <input
                                        type="text"
                                        name="number"
                                        value={cardData.number}
                                        onChange={handleCardChange}
                                        disabled={isLoading}
                                        placeholder="0000 0000 0000 0000"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] transition-all disabled:opacity-50"
                                    />
                                </div>
                                <div className="relative group">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">CVV</label>
                                    <input
                                        type="text"
                                        name="ccv"
                                        value={cardData.ccv}
                                        onChange={handleCardChange}
                                        disabled={isLoading}
                                        placeholder="000"
                                        maxLength={4}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] transition-all disabled:opacity-50"
                                    />
                                </div>
                                <div className="relative group">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Mês Exp.</label>
                                    <input
                                        type="text"
                                        name="expiryMonth"
                                        value={cardData.expiryMonth}
                                        onChange={handleCardChange}
                                        disabled={isLoading}
                                        placeholder="MM"
                                        maxLength={2}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] transition-all disabled:opacity-50"
                                    />
                                </div>
                                <div className="relative group">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Ano Exp.</label>
                                    <input
                                        type="text"
                                        name="expiryYear"
                                        value={cardData.expiryYear}
                                        onChange={handleCardChange}
                                        disabled={isLoading}
                                        placeholder="AAAA"
                                        maxLength={4}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] transition-all disabled:opacity-50"
                                    />
                                </div>
                                <div className="relative group">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">CEP</label>
                                    <input
                                        type="text"
                                        name="postalCode"
                                        value={cardData.postalCode}
                                        onChange={handleCardChange}
                                        disabled={isLoading}
                                        placeholder="00000-000"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] transition-all disabled:opacity-50"
                                    />
                                </div>
                                <div className="relative group">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Número</label>
                                    <input
                                        type="text"
                                        name="addressNumber"
                                        value={cardData.addressNumber}
                                        onChange={handleCardChange}
                                        disabled={isLoading}
                                        placeholder="123"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] transition-all disabled:opacity-50"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {paymentMethod === 'pix' && (
                        <>
                            <h2 className="text-lg font-semibold text-slate-800 mb-4 tracking-tight">Pagamento via Pix</h2>
                            <div className="bg-[#f0f9fa] border border-[#35b6cf]/10 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 bg-[#35b6cf]/10 rounded-lg shrink-0 mt-0.5">
                                            <Zap size={16} className="text-[#35b6cf] fill-[#35b6cf]" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-sm">Aprovação Imediata</h3>
                                            <p className="text-xs text-slate-500">Seu acesso será liberado assim que o pagamento for confirmado.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 bg-[#35b6cf]/10 rounded-lg shrink-0 mt-0.5">
                                            <QrCode size={16} className="text-[#35b6cf]" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-sm">QR Code Exclusivo</h3>
                                            <p className="text-xs text-slate-500">Ao finalizar, geraremos um código Pix para você escanear ou copiar.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="shrink-0 flex flex-col items-center justify-center bg-white p-5 rounded-xl shadow-sm border border-slate-50 min-w-[200px]">
                                    <QrCode size={64} className="text-slate-200 mb-2" />
                                    <span className="text-[10px] text-center text-slate-400 max-w-[140px] font-medium leading-tight">O QR Code será gerado na próxima tela</span>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="text-[10px] text-slate-400 mb-6 leading-relaxed">
                        Ao clicar em {paymentMethod === 'pix' ? 'gerar pix' : 'pagar agora'}, você concorda com os nossos <a className="font-bold text-[#35b6cf] hover:underline" href="#">Termos e Condições</a>.
                    </div>

                    <div className="flex flex-col-reverse md:flex-row items-center gap-4 mb-8">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="w-full md:w-auto px-6 py-3 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <ArrowLeft size={16} />
                            Voltar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="w-full md:w-auto flex-1 bg-[#35b6cf] hover:bg-[#2ca3bc] text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-cyan-200/50 transition-all flex items-center justify-center gap-2 group disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                paymentMethod === 'pix' ? <QrCode size={18} className="group-hover:scale-110 transition-transform" /> : <CreditCard size={18} className="group-hover:scale-110 transition-transform" />
                            )}
                            {paymentMethod === 'pix' ? 'Gerar Pix' : 'Pagar'} R$ {selectedPackage.price}
                        </button>
                    </div>

                    {/* Footer: Accepted Methods */}
                    <div className="mt-auto pt-8 border-t border-slate-50 flex flex-col items-center">
                        <p className="text-[10px] text-slate-400 mb-3 uppercase tracking-widest font-bold">Métodos Aceitos</p>
                        <div className="flex flex-wrap justify-center items-center gap-3 opacity-60">
                            {['VISA', 'MASTERCARD', 'ELO', 'PIX', 'DÉBITO'].map((method) => (
                                <div key={method} className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                    <span className="text-[9px] font-black text-slate-500">{method}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Order Summary */}
                <div className="lg:col-span-4 space-y-6">
                    <h2 className="text-xl font-bold text-slate-800 pl-1 tracking-tight">Detalhes do Pacote</h2>
                    <div className="bg-[#f8fafc] rounded-[2rem] p-8 border border-slate-100 sticky top-6">
                        <div className="mb-6 pb-6 border-b border-slate-200">
                            <h3 className="text-2xl font-black text-[#35b6cf] mb-1 tracking-tight">{selectedPackage.name}</h3>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold text-slate-800">R$ {selectedPackage.price}</span>
                                <span className="text-xs font-medium text-slate-400 lowercase">pagamento único</span>
                            </div>
                        </div>

                        <ul className="space-y-4 mb-10">
                            {[
                                `${selectedPackage.tokens.toLocaleString()} Tokens de Formulário`,
                                'Acesso Completo às Métricas',
                                'Gerenciamento de Colaboradores',
                                'Suporte Prioritário Gama',
                                'Relatórios em PDF Ilimitados',
                                'Histórico Geral de Atividades'
                            ].map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <div className="bg-emerald-500 rounded-full p-0.5 mt-0.5 shadow-sm shadow-emerald-200">
                                        <Check size={10} className="text-white font-black" />
                                    </div>
                                    <span className="text-[13px] font-medium text-slate-600 leading-tight">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-slate-50">
                            <div className="w-12 h-12 rounded-full bg-[#35b6cf]/10 flex items-center justify-center mb-3 text-[#35b6cf]">
                                <ShieldCheck size={24} className="animate-pulse" />
                            </div>
                            <span className="text-sm font-bold text-[#35b6cf]">Garantia de 30 dias</span>
                            <span className="text-[10px] text-slate-400 mt-1 font-medium leading-tight">Reembolso total se não estiver satisfeito</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
