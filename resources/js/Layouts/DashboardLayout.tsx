import { Sidebar } from '@/Components/Sidebar';
import { PropsWithChildren, useState } from 'react';
import { User } from '@/types';
import { Menu, X, LogOut } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { ClickAnimation } from '@/Components/ClickAnimation';
import { SplashWelcome } from '@/Components/SplashWelcome';
import { GlobalSamplingAlertListener } from '@/Components/GlobalSamplingAlertListener';

export default function DashboardLayout({ user, header, children }: PropsWithChildren<{ user?: User, header?: React.ReactNode }>) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <SplashWelcome />
            <ClickAnimation />
            {/* Desktop Sidebar - Sticky to push content */}
            <div className="hidden md:flex w-20 hover:w-64 flex-col sticky top-0 h-screen z-50 transition-all duration-300 ease-in-out group flex-shrink-0 print:hidden">
                <Sidebar />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Drawer */}
                    <div className="fixed inset-y-0 left-0 w-64 max-w-[85vw] bg-slate-900 shadow-xl transition-transform transform translate-x-0">
                        <div className="absolute top-4 right-4 z-50">
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-zinc-400 hover:text-white p-1"
                                aria-label="Cerrar menú"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <Sidebar className="border-none" isMobile={true} onClose={() => setIsMobileMenuOpen(false)} />
                    </div>
                </div>
            )}

            {/* Main Content - Flex grow to fill remaining space */}
            <main className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out overflow-x-hidden w-0">
                {/* Top Header */}
                <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 print:hidden">
                    <div className="flex h-16 items-center px-3 sm:px-6 justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            {/* Mobile Toggle */}
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="md:hidden mr-1 sm:mr-2 p-1.5 sm:p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 shrink-0"
                                aria-label="Abrir menú"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                            <h1 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{header}</h1>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                            {/* Alerta Global de Muestreo Bloqueado para Supervisión */}
                            <GlobalSamplingAlertListener />

                            {/* User Profile & Logout */}
                            <div className="flex items-center gap-1.5 sm:gap-3">
                                <span className="text-xs sm:text-sm font-medium text-gray-700 hidden lg:block">{user?.name}</span>
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs sm:text-sm shrink-0">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 transition-colors shrink-0"
                                    title="Cerrar Sesión"
                                >
                                    <LogOut className="h-5 w-5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 space-y-4 p-3 sm:p-6 md:p-8 pt-4 sm:pt-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
