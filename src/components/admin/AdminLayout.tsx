import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { LayoutDashboard, Users, Car, FileText, FileBarChart, LogOut, Loader2, PlusCircle, Menu, X, ClipboardList, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';


const NAV = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/orders', icon: ClipboardList, label: 'Órdenes' },
    { to: '/admin/orders/nueva', icon: PlusCircle, label: 'Nueva Orden' },
    { to: '/admin/clientes', icon: Users, label: 'Clientes' },
    { to: '/admin/vehiculos', icon: Car, label: 'Vehículos' },
    { to: '/admin/reportes', icon: FileBarChart, label: 'Reportes' },
    { to: '/admin/configuracion', icon: Settings, label: 'Configuración' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/admin/login');
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-5 py-5 border-b border-[rgba(15,23,42,0.07)]">
                <img src="/logo.png" alt="SuColor" className="h-10 w-auto object-contain drop-shadow-sm" />
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {NAV.map(({ to, icon: Icon, label }) => {
                    const active = location.pathname === to;
                    return (
                        <Link
                            key={to}
                            to={to}
                            onClick={() => setMobileOpen(false)}
                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative ${active
                                ? 'bg-[#F97316]/10 text-[#F97316] dark:text-[#FB923C] dark:bg-[#F97316]/20'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                                }`}
                        >
                            {active && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#F97316] rounded-full" />
                            )}
                            <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#F97316]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="px-3 py-4 border-t border-[rgba(15,23,42,0.07)]">
                <div className="px-3 mb-2">
                    <p className="text-xs text-[rgba(11,18,32,0.40)] dark:text-slate-400 truncate">{user?.email}</p>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[rgba(11,18,32,0.55)] dark:text-slate-400 hover:text-[#EF4444] dark:hover:text-red-400 hover:bg-[rgba(239,68,68,0.06)] dark:hover:bg-red-500/10 transition-all duration-150"
                >
                    <LogOut className="w-4 h-4 group-hover:text-[#EF4444]" />
                    Cerrar sesión
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex mesh-gradient">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50">
                <SidebarContent />
            </aside>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-56 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-r border-slate-200/50 dark:border-slate-800/50 transform transition-transform duration-200 ease-out lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <button
                    onClick={() => setMobileOpen(false)}
                    className="absolute top-4 right-3 p-1.5 rounded-lg text-[rgba(11,18,32,0.40)] hover:text-[#0B1220] hover:bg-[rgba(15,23,42,0.05)]"
                >
                    <X className="w-4 h-4" />
                </button>
                <SidebarContent />
            </div>

            {/* Main area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile topbar */}
                <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="p-1.5 rounded-lg text-[rgba(11,18,32,0.55)] hover:bg-[rgba(15,23,42,0.05)] dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <img src="/logo.png" alt="SuColor" className="h-7 w-auto object-contain" />
                    </div>

                </div>

                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
