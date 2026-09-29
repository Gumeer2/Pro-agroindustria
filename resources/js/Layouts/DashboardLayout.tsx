import { Sidebar } from '@/Components/Sidebar';
import { PropsWithChildren, useState } from 'react';
import { User } from '@/types';
import { Menu, X, LogOut } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { ClickAnimation } from '@/Components/ClickAnimation';
import { SplashWelcome } from '@/Components/SplashWelcome';

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
                    <div className="fixed inset-y-0 left-0 w-64 bg-slate-900 shadow-xl transition-transform transform translate-x-0">
                        <div className="absolute top-4 right-4 z-50">
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-zinc-400 hover:text-white"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <Sidebar className="border-none" isMobile={true} />
                    </div>
                </div>
            )}

            {/* Main Content - Flex grow to fill remaining space */}
            <main className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out overflow-x-hidden w-0">
                {/* Top Header */}
                <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 print:hidden">
                    <div className="flex h-16 items-center px-6 justify-between">
                        <div className="flex items-center gap-2">
                            {/* Mobile Toggle */}
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="md:hidden mr-2 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                            <h1 className="text-lg font-semibold text-gray-900">{header}</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* User Profile & Logout */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-700 hidden md:block">{user?.name}</span>
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Cerrar Sesión"
                                >
                                    <LogOut className="h-5 w-5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
