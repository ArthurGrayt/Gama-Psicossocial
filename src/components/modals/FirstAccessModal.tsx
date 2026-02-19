import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';

interface FirstAccessModalProps {
    isOpen: boolean;
}

export const FirstAccessModal: React.FC<FirstAccessModalProps> = ({ isOpen }) => {
    const { user, refreshProfile } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    console.log('FirstAccessModal isOpen:', isOpen);
    // Safety check: logic requires both isOpen=true AND a valid user object
    if (!isOpen || !user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (newPassword.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem.');
            setLoading(false);
            return;
        }

        try {
            // 1. Update Supabase Auth password
            const { error: authError } = await supabase.auth.updateUser({
                password: newPassword
            });
            if (authError) throw authError;

            // 2. Update public.users table
            if (user) {
                const { error: dbError } = await supabase
                    .from('users')
                    .update({ primeiro_acesso: false })
                    .eq('user_id', user.id);

                if (dbError) throw dbError;
            }

            setSuccess(true);
            setTimeout(() => {
                refreshProfile();
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        // Wrapper Principal
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4">

            {/* Backdrop Separado */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" />

            {/* Container do Modal */}
            <div
                className="relative bg-white rounded-t-[2rem] md:rounded-2xl w-full md:max-w-md overflow-hidden isolation-isolate shadow-2xl animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200 border border-slate-200"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div className="bg-[#139690] p-8 text-center text-white relative z-10 rounded-t-[2rem] md:rounded-t-2xl">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden rounded-t-[2rem] md:rounded-t-2xl">
                        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white blur-3xl" />
                        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-white blur-3xl" />
                    </div>

                    <div className="mx-auto w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-white/30">
                        <ShieldCheck size={40} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">Primeiro Acesso</h2>
                    <p className="text-white/80 mt-2 text-sm">Para sua segurança, você deve alterar sua senha inicial.</p>
                </div>

                <div className="p-8">
                    {success ? (
                        <div className="text-center py-6 animate-in zoom-in-90 duration-500">
                            <div className="mx-auto w-16 h-16 bg-[#139690]/10 text-[#139690] rounded-full flex items-center justify-center mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Senha Alterada!</h3>
                            <p className="text-slate-500 mt-2">Sua conta está segura e pronta para uso.</p>
                            <p className="text-slate-400 text-xs mt-4">Redirecionando em instantes...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nova Senha</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#139690] transition-colors" size={18} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#139690]/20 focus:border-[#139690] transition-all outline-none text-slate-800 font-medium placeholder:text-slate-300"
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Confirmar Nova Senha</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#139690] transition-colors" size={18} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#139690]/20 focus:border-[#139690] transition-all outline-none text-slate-800 font-medium placeholder:text-slate-300"
                                        placeholder="Repita sua nova senha"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center gap-3 animate-in slide-in-from-top-2">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#139690] hover:bg-[#0f807a] text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Atualizando...
                                    </span>
                                ) : (
                                    <>
                                        Salvar Nova Senha
                                        <CheckCircle size={20} className="group-hover:scale-110 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                <div className="px-8 pb-8 text-center">
                    <p className="text-xs text-slate-400">Gama Center © 2025 • Todos os direitos reservados</p>
                </div>
            </div>
        </div>
    );
};
