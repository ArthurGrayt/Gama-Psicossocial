import React from 'react';
import { Settings, LogOut, LayoutDashboard, PlusCircle, Building } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FirstAccessModal } from '../components/modals/FirstAccessModal';
import logo from '../assets/logo.png';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const MENU_ITEMS = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <PlusCircle size={18} />, label: 'Cadastro', path: '/cadastro' },
    { icon: <Building size={18} />, label: 'Empresas', path: '/atividades' },
    { icon: <Settings size={18} />, label: 'Configurações', path: '/settings' },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const location = useLocation();
    const { signOut, user, profile } = useAuth();

    // DIAGNOSTIC LOGS
    console.log('🔍 DashboardLayout - Profile State:', {
        hasProfile: !!profile,
        profile: profile,
        primeiro_acesso_value: profile?.primeiro_acesso,
        primeiro_acesso_type: typeof profile?.primeiro_acesso,
        isStrictlyTrue: profile?.primeiro_acesso === true,
        modalShouldOpen: profile?.primeiro_acesso === true
    });

    // Helper to determine active state
    const isActive = (path: string) => {
        // Generic match for other routes (exact or sub-path)
        if (location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100 flex flex-col z-30">
                {/* Logo Area */}
                <div className="h-24 flex items-center px-8">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="Gama Logo" className="w-8 h-8 object-contain" />
                        <span className="font-bold text-xl text-slate-800 tracking-tight">Gama Psic</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {MENU_ITEMS.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path === '/forms' ? '/' : item.path}
                                className={`
                                    flex items-center gap-3 px-4 py-3.5 rounded-lg text-sm font-medium transition-all duration-200
                                    ${active
                                        ? 'bg-[#0f978e] text-white shadow-md shadow-emerald-200/50' // Matching the screenshot's solid teal look
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                                `}
                            >
                                <span className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile Snippet */}
                <div className="p-6 mt-auto">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors cursor-pointer group">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-sm">
                            AR
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{user?.user_metadata?.username || user?.email || 'Usuário'}</p>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Administrador</p>
                        </div>
                    </div>

                    <button
                        onClick={() => signOut()}
                        className="w-full mt-4 flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-red-500 transition-colors py-2 border border-slate-100 rounded-lg hover:bg-red-50/50"
                    >
                        <LogOut size={14} />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-72 min-h-screen flex flex-col">


                <div className="p-10 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </main>

            {/* First Access Modal - Only renders if user has primeiro_acesso === true */}
            <FirstAccessModal isOpen={profile?.primeiro_acesso === true} />
        </div>
    );
};
