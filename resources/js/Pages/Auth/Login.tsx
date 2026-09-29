import InputError from "@/Components/InputError";
import TextInput from "@/Components/TextInput";
import { Head, useForm } from "@inertiajs/react";
import { FormEventHandler, useState } from "react";
import { User, Lock, ArrowRight, Loader2, Anchor } from "lucide-react";
import Swal from "sweetalert2";
import { useEffect } from "react";

export default function Login({
    status,
    canResetPassword,
    tenant,
}: {
    status?: string;
    canResetPassword: boolean;
    tenant: any;
}) {
    const { data, setData, post, processing, errors, reset, transform } = useForm({
        username: "",
        password: "",
        remember: false,
        _token: "",
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
        transform((curr) => ({
            ...curr,
            _token: token || curr._token,
        }));

        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    // Show alert on login errors and reset splash flag
    useEffect(() => {
        // Clear splash flag so it shows up after login
        sessionStorage.removeItem('ve_splash_seen');

        if (errors && Object.keys(errors).length > 0) {
            Swal.fire({
                icon: 'error',
                title: 'Error de Acceso',
                text: errors.username || errors.password || 'Credenciales incorrectas.',
                confirmButtonColor: '#2563eb',
            });
        }
    }, [errors]);

    return (
        <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
            <Head title={`Acceso - ${tenant?.name || 'VECODE'}`} />

            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transform scale-105"
                style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
            >
                {/* Premium Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-900/20 to-indigo-900/40 backdrop-blur-[2px]"></div>
            </div>

            {/* Glass Card */}
            <div className="relative z-10 w-full max-w-md px-4 perspective-1000">
                <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-3xl p-8 md:p-10 animate-in fade-in zoom-in duration-500 hover:shadow-[0_12px_40px_0_rgba(31,38,135,0.45)] transition-shadow">

                    {/* Header */}
                    <div className="text-center mb-8 space-y-4">
                        <div className="flex justify-center items-center mb-6">
                            {/* Logo Dinámico */}
                            <div className="p-2 rounded-xl">
                                <img
                                    src={tenant?.logo || "/images/Proagro2.png"}
                                    alt={tenant?.name || "Logo"}
                                    className="h-20 w-auto object-contain transform hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                        e.currentTarget.src = "/images/logovecode.png"; // Final fallback
                                    }}
                                />
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            Bienvenido a <span className="text-blue-600">VECODE</span>
                        </h2>
                        <p className="text-slate-500 font-medium text-sm">
                            {tenant?.name || 'Sistema Integral de Operaciones Portuarias'}
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        {/* Username Field */}
                        <div className="space-y-2 group">
                            <label
                                htmlFor="username"
                                className="block text-xs font-bold uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-blue-600 transition-colors"
                            >
                                Usuario
                            </label>
                            <div className="relative transform transition-all duration-300 group-focus-within:scale-[1.02]">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <TextInput
                                    id="username"
                                    type="text"
                                    name="username"
                                    value={data.username}
                                    className="block w-full pl-12 pr-4 py-3 bg-white/50 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold text-slate-700 placeholder:text-slate-400"
                                    placeholder="Nombre de usuario"
                                    autoComplete="username"
                                    isFocused={true}
                                    onChange={(e) => setData("username", e.target.value)}
                                />
                            </div>
                            <InputError message={errors.username} className="text-xs font-semibold ml-1" />
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2 group">
                            <label
                                htmlFor="password"
                                className="block text-xs font-bold uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-blue-600 transition-colors"
                            >
                                Contraseña
                            </label>
                            <div className="relative transform transition-all duration-300 group-focus-within:scale-[1.02]">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <TextInput
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={data.password}
                                    className="block w-full pl-12 pr-12 py-3 bg-white/50 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold text-slate-700 placeholder:text-slate-400"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    onChange={(e) => setData("password", e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Ocultar</span>
                                    ) : (
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Ver</span>
                                    )}
                                </button>
                            </div>
                            <InputError message={errors.password} className="text-xs font-semibold ml-1" />
                        </div>

                        {status && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center">
                                {status}
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="group w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/30 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Iniciando...
                                    </>
                                ) : (
                                    <>
                                        Ingresar al Sistema
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center text-xs text-slate-400 font-medium">
                        <p>{tenant?.copyright_text || `© ${new Date().getFullYear()} VECODE. Todos los derechos reservados.`}</p>
                        <div className="mt-2 flex justify-center gap-2 opacity-60">
                            <Anchor className="w-3 h-3" />
                            <span>Sistema Integral de Operaciones Portuarias</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Credits overlay bottom right */}
            <div className="absolute bottom-4 right-6 z-0 text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] pointer-events-none">
                Fotografía: {tenant?.slug === 'proagro' ? 'Puerto Proagro' : 'Operación Logística'}
            </div>
        </div>
    );
}
