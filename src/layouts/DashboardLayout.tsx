import React from 'react';
import { Settings, LogOut, LayoutDashboard, Building, User } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FirstAccessModal } from '../components/modals/FirstAccessModal';
import logo from '../assets/logo.png';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const MENU_ITEMS = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/dashboard' },
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
        if (location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
            {/* Mobile Header - visible only on mobile */}
            <header className="fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-4 z-40 md:hidden">
                <div className="flex items-center gap-2">
                    <img src={logo} alt="Gama Logo" className="w-7 h-7 object-contain" />
                    <span className="font-bold text-lg text-slate-800 tracking-tight">Gama Psic</span>
                </div>
                <button
                    onClick={() => signOut()}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50/50"
                >
                    <LogOut size={18} />
                </button>
            </header>

            {/* Sidebar - hidden on mobile */}
            <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100 hidden md:flex flex-col z-30">
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
                                        ? 'bg-[#0f978e] text-white shadow-md shadow-emerald-200/50'
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
                    <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer group mb-2"
                    >
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-sm overflow-hidden border-2 border-transparent group-hover:border-[#0f978e]/30 transition-all">
                            {profile?.img_url ? (
                                <img src={profile.img_url} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                (profile?.username || user?.user_metadata?.username || 'U').charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate group-hover:text-[#0f978e] transition-colors">
                                {profile?.username || user?.user_metadata?.username || user?.email || 'Usuário'}
                            </p>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Administrador</p>
                        </div>
                    </Link>

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
            <main className="flex-1 ml-0 md:ml-64 min-h-screen flex flex-col pt-14 md:pt-0" style={{ paddingBottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}>
                <div className="p-4 md:p-10 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </main>

            {/* Mobile Tab Bar */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 flex items-center justify-around z-40 md:hidden" style={{ height: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                {MENU_ITEMS.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`
                                flex flex-col items-center justify-center gap-1 py-1 px-1 flex-1 text-[10px] font-semibold transition-all duration-200
                                ${active
                                    ? 'text-[#0f978e]'
                                    : 'text-slate-400 active:text-slate-600'}
                            `}
                        >
                            <span className={`transition-all duration-200 ${active ? 'scale-110 active:scale-100' : ''}`}>
                                {React.cloneElement(item.icon as React.ReactElement<any>, { size: 22 })}
                            </span>
                            <span className="truncate max-w-[64px]">{item.label}</span>
                        </Link>
                    );
                })}
                {/* Profile avatar tab */}
                <Link
                    to="/profile"
                    className={`
                        flex flex-col items-center justify-center gap-1 py-1 px-1 flex-1 text-[10px] font-semibold transition-all duration-200
                        ${isActive('/profile')
                            ? 'text-[#0f978e]'
                            : 'text-slate-400 active:text-slate-600'}
                    `}
                >
                    <span className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center border-2 transition-all duration-200 ${isActive('/profile') ? 'border-[#0f978e]' : 'border-slate-200'
                        }`}>
                        {profile?.img_url ? (
                            <img src={profile.img_url} alt="Perfil" className="w-full h-full object-cover" />
                        ) : (
                            <User size={14} className={isActive('/profile') ? 'text-[#0f978e]' : 'text-slate-400'} />
                        )}
                    </span>
                    <span>Perfil</span>
                </Link>
            </nav>

            {/* First Access Modal - Only renders if user has primeiro_acesso === true */}
            <FirstAccessModal isOpen={profile?.primeiro_acesso === true} />
        </div>
    );
};
