import React from 'react';
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head } from "@inertiajs/react";

export default function Index({ auth, message }: { auth: any, message: string }) {
    return (
        <DashboardLayout user={auth.user} header="Sandbox (Entorno de Pruebas)">
            <Head title="Sandbox" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border-l-4 border-amber-500">
                        <div className="p-6 text-gray-900">
                            <h2 className="text-2xl font-bold mb-4 text-amber-600">Área de Pruebas</h2>
                            <p className="mb-4">{message}</p>
                            
                            <div className="mt-8 p-4 bg-gray-50 rounded text-sm text-gray-600 border border-gray-200">
                                <strong>Instrucciones para nuevos desarrolladores:</strong>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Agrega nuevas rutas en <code>routes/sandbox.php</code>.</li>
                                    <li>Agrega nuevos métodos en <code>app/Http/Controllers/SandboxController.php</code>.</li>
                                    <li>Crea o modifica componentes React dentro de <code>resources/js/Pages/Sandbox/</code>.</li>
                                    <li>Las modificaciones aquí no afectarán los módulos principales del sistema.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
