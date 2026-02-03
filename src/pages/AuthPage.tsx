
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';

export const AuthPage: React.FC = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                // LOGIN
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate('/');
            } else {
                // REGISTER
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (authError) throw authError;

                if (authData.user) {
                    // Insert into public.users
                    const { error: dbError } = await supabase
                        .from('users')
                        .insert([
                            {
                                user_id: authData.user.id,
                                username: username,
                                email: email,
                                img_url: 'https://wofipjazcxwxzzxjsflh.supabase.co/storage/v1/object/sign/img_user/profile_pics/padrao.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82YzdhYzE0NS00N2RmLTQ3ZjItYWYyMi0xZDFkOTE0NTM3Y2EiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWdfdXNlci9wcm9maWxlX3BpY3MvcGFkcmFvLmpwZyIsImlhdCI6MTc1OTI0Mzk1MiwiZXhwIjo4ODE1OTE1NzU1Mn0.AWDYc1mewJEuVqVSeUlJJykNj801mzyMequTNPHqfL0',
                                primeiro_acesso: true,
                            },
                        ]);

                    if (dbError) {
                        // Optional: Rollback auth user creation if DB insert fails?
                        // For now, simpler to just start with throwing
                        throw dbError;
                    }
                }
                navigate('/');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden flex flex-col">
                <div className="p-8 bg-white border-b border-slate-50">
                    <div className="text-center mb-8">
                        {/* Placeholder Logo or Title */}
                        <div className="w-16 h-16 bg-[#35b6cf]/10 text-[#35b6cf] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <User size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
                        </h1>
                        <p className="text-slate-400 text-sm mt-2">
                            {isLogin ? 'Insira suas credenciais para acessar' : 'Preencha os dados para começar'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        {!isLogin && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Nome de Usuário</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        required={!isLogin}
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] transition-all outline-none text-slate-800 font-medium"
                                        placeholder="Seu nome"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] transition-all outline-none text-slate-800 font-medium"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] transition-all outline-none text-slate-800 font-medium"
                                    placeholder="••••••••"
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

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-medium">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#35b6cf] hover:bg-[#2ca1b7] text-white font-bold py-3 rounded-lg transition-all active:scale-[0.98] shadow-md shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                        >
                            {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
                        </button>
                    </form>
                </div>
                <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
                    <p className="text-sm text-slate-500">
                        {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="ml-2 font-bold text-[#35b6cf] hover:underline"
                        >
                            {isLogin ? 'Cadastre-se' : 'Faça Login'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
