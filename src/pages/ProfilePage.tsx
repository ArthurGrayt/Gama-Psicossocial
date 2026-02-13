import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Camera, Save, ArrowLeft, Loader2, CheckCircle2, Crown, Coins, CalendarCheck, CalendarClock, Plus, X } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { PaymentModal } from '../components/modals/PaymentModal';
import logo from '../assets/logo.png';


export const ProfilePage: React.FC = () => {
    const { profile, user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Token Purchase Modal State
    const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
    const [tokenQuantity, setTokenQuantity] = useState<number>(100);

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<{ id: string; name: string; tokens: number; price: string } | null>(null);

    // Profile Picture Upload State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const PRICE_PER_TOKEN = 0.10;

    const [formData, setFormData] = useState({
        username: '',
        img_url: '',
        email: '',
        subscription_plan: '',
        tokens: 0,
        subscription_start_date: '',
        subscription_end_date: ''
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                username: profile.username || '',
                img_url: profile.img_url || '',
                email: profile.email || '',
                subscription_plan: profile.subscription_plan || 'Nenhum',
                tokens: profile.tokens || 0,
                subscription_start_date: profile.subscription_start_date || '',
                subscription_end_date: profile.subscription_end_date || ''
            });
        }
    }, [profile]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Não definida';
        try {
            return new Date(dateStr).toLocaleDateString('pt-BR');
        } catch (e) {
            return dateStr;
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione uma imagem válida.');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}_${Date.now()}.${fileExt}`;
            const filePath = `user_prof_pics/${fileName}`;

            // 1. Upload para o Bucket 'data'
            const { error: uploadError } = await supabase.storage
                .from('data')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Obter URL Pública
            const { data: { publicUrl } } = supabase.storage
                .from('data')
                .getPublicUrl(filePath);

            // 3. Atualizar Tabela 'users'
            const { error: updateError } = await supabase
                .from('users')
                .update({ img_url: publicUrl })
                .eq('user_id', user.id);

            if (updateError) throw updateError;

            // 4. Sincronizar FormData e Refresh Profile
            setFormData(prev => ({ ...prev, img_url: publicUrl }));
            await refreshProfile();

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);

        } catch (err: any) {
            console.error('Error uploading image:', err);
            setError('Erro ao enviar imagem: ' + (err.message || 'Erro desconhecido'));
        } finally {
            setIsUploading(false);
            // Reset input
            if (event.target) event.target.value = '';
        }
    };

    const handleSave = async () => {
        if (!user) return;

        setIsSaving(true);
        setError(null);
        setShowSuccess(false);

        try {
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    username: formData.username,
                    img_url: formData.img_url
                })
                .eq('user_id', user.id);

            if (updateError) throw updateError;

            await refreshProfile();
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setError(err.message || 'Erro ao atualizar perfil');
        } finally {
            setIsSaving(false);
        }
    };

    const handleProceedToPayment = () => {
        if (tokenQuantity <= 0) return;

        const totalPrice = (tokenQuantity * PRICE_PER_TOKEN).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        setSelectedPackage({
            id: 'custom-profile',
            name: `Pacote Customizado (${tokenQuantity} tokens)`,
            tokens: tokenQuantity,
            price: totalPrice
        });

        setIsTokenModalOpen(false);
        setIsPaymentModalOpen(true);
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header with Back Button */}
                <div className="flex items-center gap-4 mb-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hidden md:block"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Meu Perfil</h1>
                        <p className="text-slate-500 text-sm">Gerencie suas informações pessoais e aparência</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Side: Avatar Preview */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                            <div className="relative group">
                                <div className={`w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center ${isUploading ? 'opacity-50' : ''}`}>
                                    {isUploading ? (
                                        <Loader2 size={32} className="text-[#0f978e] animate-spin" />
                                    ) : formData.img_url ? (
                                        <img
                                            src={formData.img_url}
                                            alt="Avatar"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + formData.username;
                                            }}
                                        />
                                    ) : (
                                        <User size={48} className="text-slate-300" />
                                    )}
                                </div>
                                <div
                                    onClick={handleUploadClick}
                                    className={`absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer ${isUploading ? 'pointer-events-none' : ''}`}
                                >
                                    <Camera size={24} className="text-white" />
                                </div>
                            </div>

                            <div className="mt-6 text-center">
                                <h3 className="font-bold text-slate-900 text-lg">{formData.username || 'Usuário'}</h3>
                                <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mt-1">Administrador</p>
                            </div>
                        </div>

                    </div>

                    {/* Right Side: Edit Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-8 space-y-6">
                                {/* Name Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <User size={16} className="text-[#0f978e]" />
                                        Nome de Usuário
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                        placeholder="Seu nome completo"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f978e]/20 focus:border-[#0f978e] transition-all"
                                    />
                                </div>

                                {/* Email Display (Read-only) */}
                                <div className="space-y-2 opacity-80">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <Mail size={16} className="text-[#0f978e]" />
                                        E-mail do Sistema
                                    </label>
                                    <div className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 cursor-not-allowed">
                                        {formData.email}
                                    </div>
                                    <p className="text-[10px] text-slate-400 pl-1 italic">O e-mail não pode ser alterado por questões de segurança.</p>
                                </div>

                                <hr className="border-slate-100" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Subscription Plan */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <Crown size={16} className="text-amber-500" />
                                            Plano de Assinatura
                                        </label>
                                        <div className="w-full px-4 py-3 bg-amber-50/50 border border-amber-100 rounded-xl text-amber-700 font-semibold cursor-not-allowed flex items-center gap-2">
                                            {formData.subscription_plan}
                                        </div>
                                    </div>

                                    {/* Tokens */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <Coins size={16} className="text-[#0f978e]" />
                                            Tokens Disponíveis
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl cursor-not-allowed flex items-center gap-1.5">
                                                <span className="text-lg font-bold text-slate-700 leading-none">{formData.tokens}</span>
                                                <img src={logo} alt="Gama" className="h-[18px] w-auto object-contain translate-y-[1px]" />
                                            </div>
                                            <button
                                                onClick={() => setIsTokenModalOpen(true)}
                                                className="px-4 py-3 bg-[#0f978e]/10 text-[#0f978e] rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-[#0f978e]/20 transition-all border border-[#0f978e]/20"
                                            >
                                                <Plus size={14} />
                                                Comprar
                                            </button>
                                        </div>
                                    </div>

                                    {/* Start Date */}
                                    <div className="space-y-2 opacity-80">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <CalendarCheck size={16} className="text-blue-500" />
                                            Início da Assinatura
                                        </label>
                                        <div className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 cursor-not-allowed font-mono text-sm">
                                            {formatDate(formData.subscription_start_date)}
                                        </div>
                                    </div>

                                    {/* End Date */}
                                    <div className="space-y-2 opacity-80">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <CalendarClock size={16} className="text-red-400" />
                                            Vencimento da Assinatura
                                        </label>
                                        <div className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 cursor-not-allowed font-mono text-sm">
                                            {formatDate(formData.subscription_end_date)}
                                        </div>
                                    </div>
                                </div>


                                {/* Feedback Messages */}
                                {error && (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 animate-in fade-in zoom-in-95">
                                        {error}
                                    </div>
                                )}

                                {showSuccess && (
                                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold border border-emerald-100 flex items-center gap-2 animate-in fade-in zoom-in-95">
                                        <CheckCircle2 size={18} />
                                        Perfil atualizado com sucesso!
                                    </div>
                                )}
                            </div>

                            {/* Form Actions */}
                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-8 py-3.5 bg-[#0f978e] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#0d857d] hover:shadow-lg hover:shadow-[#0f978e]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            Salvar Alterações
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Token Purchase Modal */}
            {isTokenModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#0f978e]/10 flex items-center justify-center text-[#0f978e]">
                                    <Coins size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Adicionar Tokens</h3>
                                    <p className="text-xs text-slate-500">Insira a quantidade desejada</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsTokenModalOpen(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-700">Quantidade de Tokens</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        value={tokenQuantity}
                                        onChange={(e) => setTokenQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-2xl font-bold text-slate-900 focus:outline-none focus:border-[#0f978e] focus:ring-4 focus:ring-[#0f978e]/10 transition-all pr-16"
                                    />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                        <img src={logo} alt="Gama" className="h-[24px] w-auto opacity-40" />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Mínimo de 1 token</p>
                            </div>

                            <div className="bg-[#0f978e]/5 rounded-2xl p-4 border border-[#0f978e]/10 flex items-start gap-3">
                                <div className="p-1.5 bg-white rounded-lg shadow-sm text-[#0f978e]">
                                    <Coins size={16} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-800">Resumo da Compra</p>
                                    <p className="text-xs text-slate-500">
                                        <span className="font-bold">{tokenQuantity}</span> tokens × R$ {PRICE_PER_TOKEN.toFixed(2).replace('.', ',')} = <span className="font-bold text-[#0f978e]">R$ {(tokenQuantity * PRICE_PER_TOKEN).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                            <button
                                onClick={() => setIsTokenModalOpen(false)}
                                className="flex-1 px-6 py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleProceedToPayment}
                                disabled={tokenQuantity <= 0}
                                className="flex-[2] px-6 py-3.5 bg-[#0f978e] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#0d857d] hover:shadow-lg hover:shadow-[#0f978e]/20 transition-all disabled:opacity-50"
                            >
                                <Plus size={18} />
                                Ir para Pagamento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                selectedPackage={selectedPackage}
            />
        </DashboardLayout >
    );
};
