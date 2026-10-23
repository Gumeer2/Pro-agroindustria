<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Orden de Mantenimiento {{ $maintenance->folio }} - Proagroindustria</title>
    <link rel="icon" type="image/png" href="{{ asset('Proagro.png') }}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', sans-serif; color: #1e293b; background: #fff; }
        @media print {
            .no-print { display: none !important; }
            body { padding: 0; background: #fff; }
            @page { margin: 12mm 15mm; size: letter portrait; }
        }
    </style>
</head>
<body class="p-6 max-w-4xl mx-auto">

    <!-- Print Action Bar -->
    <div class="no-print mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between shadow-sm">
        <div class="flex items-center space-x-2">
            <a href="{{ route('apt.machinery', ['from' => 'production', 'tab' => 'records']) }}" class="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100">
                <i class="fa-solid fa-arrow-left mr-1"></i> Volver a Maquinarias
            </a>
            <span class="text-xs text-gray-500">Expediente Oficial de Orden de Trabajo</span>
        </div>
        <button onclick="window.print()" class="px-4 py-2 bg-rose-900 hover:bg-rose-950 text-white rounded-lg text-xs font-bold shadow flex items-center gap-2">
            <i class="fa-solid fa-print"></i>
            <span>Imprimir Documento</span>
        </button>
    </div>

    <!-- Official Format Container -->
    <div class="border-2 border-gray-800 p-6 rounded-lg text-xs">
        
        <!-- Header Table -->
        <div class="border-b-2 border-gray-800 pb-4 mb-4 flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <img src="{{ asset('Proagro.png') }}" alt="Proagroindustria" class="h-12 w-auto object-contain">
                <div>
                    <h1 class="text-base font-black tracking-wide uppercase text-gray-950">PRO-AGROINDUSTRIA S.A. DE C.V.</h1>
                    <p class="text-[10px] text-gray-600 font-semibold uppercase">Superintendencia de Administración Portuaria (APT)</p>
                    <p class="text-[10px] text-gray-500">Departamento de Mantenimiento Mecánico y Maquinaria Pesada</p>
                </div>
            </div>
            <div class="text-right">
                <div class="border-2 border-rose-900 px-3 py-1 rounded bg-rose-50 text-rose-950">
                    <span class="text-[9px] font-black uppercase block tracking-widest text-rose-800">Folio Orden de Trabajo</span>
                    <span class="text-sm font-black font-mono">{{ $maintenance->folio }}</span>
                </div>
                <span class="text-[9px] text-gray-500 font-bold block mt-1">CÓDIGO: GLS-AP-FO-012 &bull; REV. 02</span>
            </div>
        </div>

        <!-- Banner Title -->
        <div class="bg-rose-950 text-white py-1.5 px-3 rounded text-center font-black uppercase text-xs tracking-wider mb-4">
            ORDEN DE TRABAJO Y PROCESO DE MANTENIMIENTO DE MAQUINARIA
        </div>

        <!-- Section 1: General Info -->
        <div class="grid grid-cols-4 gap-2 mb-4 border border-gray-300 p-3 rounded bg-gray-50/50">
            <div>
                <span class="block text-[10px] text-gray-500 font-bold uppercase">Equipo / Maquinaria:</span>
                <span class="font-extrabold text-gray-900 text-sm">{{ $maintenance->machinery_name }}</span>
            </div>
            <div>
                <span class="block text-[10px] text-gray-500 font-bold uppercase">No. Económico / Catálogo:</span>
                <span class="font-bold text-gray-800">{{ $maintenance->economic_number ?? 'CF-01' }} ({{ $maintenance->machinery_code ?? '2010001' }})</span>
            </div>
            <div>
                <span class="block text-[10px] text-gray-500 font-bold uppercase">Tipo de Mantenimiento:</span>
                <span class="font-extrabold uppercase {{ $maintenance->type === 'correctivo' ? 'text-red-700' : 'text-blue-700' }}">
                    {{ $maintenance->type }}
                </span>
            </div>
            <div>
                <span class="block text-[10px] text-gray-500 font-bold uppercase">Horómetro Registrado:</span>
                <span class="font-extrabold text-gray-900">{{ number_format($maintenance->hours_worked ?? 0, 1) }} hrs</span>
            </div>
        </div>

        <!-- Section 2: Failure & Diagnostic -->
        <div class="border border-gray-300 rounded mb-4 overflow-hidden">
            <div class="bg-gray-100 px-3 py-1 font-bold text-gray-800 uppercase text-[10px] border-b border-gray-300 flex justify-between">
                <span>1. Reporte de Falla &bull; Diagnóstico Técnico (P/N)</span>
                <span>Status Inicial: <strong class="text-red-700">ROJO (Paro Operativo)</strong></span>
            </div>
            <div class="p-3 space-y-2">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <span class="block text-[10px] text-gray-500 font-bold uppercase">Reportado Por (Operador):</span>
                        <span class="font-medium text-gray-900">{{ $maintenance->operator_name ?? 'Operador Maq.' }}</span>
                    </div>
                    <div>
                        <span class="block text-[10px] text-gray-500 font-bold uppercase">Fecha y Hora de Reporte:</span>
                        <span class="font-mono text-gray-800">{{ $maintenance->reported_at ? $maintenance->reported_at->format('d/m/Y H:i') : $maintenance->created_at->format('d/m/Y H:i') }}</span>
                    </div>
                </div>
                <div>
                    <span class="block text-[10px] text-gray-500 font-bold uppercase">Descripción de la Falla:</span>
                    <p class="text-gray-900 italic bg-white p-2 rounded border border-gray-200 mt-0.5">
                        "{{ $maintenance->failure_description }}"
                    </p>
                </div>
                <div class="grid grid-cols-2 gap-4 pt-1">
                    <div>
                        <span class="block text-[10px] text-gray-500 font-bold uppercase">Mecánico Asignado:</span>
                        <span class="font-bold text-gray-800">{{ $maintenance->mechanic_name ?? 'Pendiente de asignación' }}</span>
                    </div>
                    <div>
                        <span class="block text-[10px] text-gray-500 font-bold uppercase">Número de Parte (P/N) Refacción:</span>
                        <span class="font-mono font-bold text-rose-900">{{ $maintenance->part_number ?? 'Pendiente de diagnóstico' }}</span>
                    </div>
                </div>
                @if($maintenance->diagnostic_notes)
                <div>
                    <span class="block text-[10px] text-gray-500 font-bold uppercase">Diagnóstico / Revisión Visual:</span>
                    <p class="text-gray-800 bg-white p-2 rounded border border-gray-200 mt-0.5">{{ $maintenance->diagnostic_notes }}</p>
                </div>
                @endif
            </div>
        </div>

        <!-- Section 3: OT, Permiso & Seguridad LOTO -->
        <div class="grid grid-cols-2 gap-4 mb-4">
            <!-- OT & Costo -->
            <div class="border border-gray-300 rounded p-3 bg-gray-50/50">
                <h4 class="font-bold text-gray-800 uppercase text-[10px] border-b pb-1 mb-2">2. Justificación & Permiso de Trabajo</h4>
                <div class="space-y-1.5">
                    <div class="flex justify-between">
                        <span class="text-gray-500">Folio O.T. Interna:</span>
                        <span class="font-mono font-bold">{{ $maintenance->work_order_folio ?? 'OT-PTE' }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Permiso de Trabajo:</span>
                        <span class="font-mono font-bold">{{ $maintenance->work_permit_number ?? 'PT-2026-OK' }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Costo Estimado:</span>
                        <span class="font-bold text-gray-900">${{ number_format($maintenance->estimated_cost ?? 0, 2) }} MXN</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Autorizado Por:</span>
                        <span class="font-bold text-gray-800">{{ $maintenance->authorized_by ?? 'Jefe APT' }}</span>
                    </div>
                </div>
            </div>

            <!-- Seguridad LOTO -->
            <div class="border border-amber-300 rounded p-3 bg-amber-50/50">
                <h4 class="font-bold text-amber-900 uppercase text-[10px] border-b border-amber-200 pb-1 mb-2 flex items-center justify-between">
                    <span>3. Protocolo de Seguridad LOTO</span>
                    <i class="fa-solid fa-lock text-amber-600"></i>
                </h4>
                <div class="space-y-1.5">
                    <div class="flex justify-between">
                        <span class="text-amber-800">Bloqueo y Etiquetado:</span>
                        <span class="font-black {{ $maintenance->loto_applied ? 'text-emerald-700' : 'text-amber-700' }}">
                            {{ $maintenance->loto_applied ? 'APLICADO Y ACTIVO' : 'NO APLICADO / N/A' }}
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-amber-800">No. Candado / Tarjeta:</span>
                        <span class="font-mono font-bold">{{ $maintenance->loto_tag_number ?? 'LOTO-APT-STANDARD' }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-amber-800">Prueba Operativa:</span>
                        <span class="font-black {{ $maintenance->operational_test_passed ? 'text-emerald-700' : 'text-gray-600' }}">
                            {{ $maintenance->operational_test_passed ? 'SUPERADA AL 100%' : 'PENDIENTE' }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Section 4: 10-Step Progress Table -->
        <div class="border border-gray-300 rounded mb-6 overflow-hidden">
            <div class="bg-gray-100 px-3 py-1 font-bold text-gray-800 uppercase text-[10px] border-b border-gray-300">
                4. Control de Etapas Oficiales (10 Pasos GLS)
            </div>
            <table class="min-w-full divide-y divide-gray-200 text-left text-[11px]">
                <thead class="bg-gray-50 font-bold text-gray-700">
                    <tr>
                        <th class="px-2.5 py-1">Paso</th>
                        <th class="px-2.5 py-1">Etapa</th>
                        <th class="px-2.5 py-1">Responsable</th>
                        <th class="px-2.5 py-1 text-center">Estatus</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    @php
                    $stepsList = [
                        1 => ['Reporte de falla', 'OPERADOR DE MAQ.'],
                        2 => ['Se reporta en bitácora (Status ROJO)', 'SUPERVISOR APT'],
                        3 => ['Diagnóstico técnico y P/N', 'MECANICO'],
                        4 => ['O.T. + Permiso trabajo', 'SUP. APT. + MECANICO'],
                        5 => ['Autorización y compra', 'JEFE APT'],
                        6 => ['Entrega refacción', 'MECANICO'],
                        7 => ['Ejecución (Mantto. + LOTO)', 'MECANICO'],
                        8 => ['Reporte de trabajo ejecutado', 'SUP. APT. + MECANICO'],
                        9 => ['Firma entregado / recibido', 'SUP. APT. + MECANICO'],
                        10 => ['Cierre proceso finalizado', 'SUPERVISOR APT'],
                    ];
                    @endphp
                    @foreach($stepsList as $num => $info)
                    <tr class="{{ $maintenance->current_step >= $num ? 'bg-white' : 'bg-gray-50/50 text-gray-400' }}">
                        <td class="px-2.5 py-1 font-bold">{{ $num }}</td>
                        <td class="px-2.5 py-1 font-medium">{{ $info[0] }}</td>
                        <td class="px-2.5 py-1 font-bold text-gray-700">{{ $info[1] }}</td>
                        <td class="px-2.5 py-1 text-center font-bold">
                            @if($maintenance->current_step > $num)
                            <span class="text-emerald-700">&check; Completado</span>
                            @elseif($maintenance->current_step == $num)
                            <span class="text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded font-black">&bull; En Proceso</span>
                            @else
                            <span class="text-gray-400">&minus; Pendiente</span>
                            @endif
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <!-- Signatures Section -->
        <div class="mt-8 pt-4 border-t-2 border-gray-400">
            <h4 class="text-center font-bold uppercase text-[10px] text-gray-500 mb-6">VALIDACIÓN Y FIRMAS MANCOMUNADAS DE ENTREGA - RECEPCIÓN</h4>
            <div class="grid grid-cols-4 gap-4 text-center">
                <div>
                    <div class="border-b border-gray-400 h-10 mb-1"></div>
                    <span class="font-bold text-gray-900 block text-[10px]">OPERADOR MAQUINARIA</span>
                    <span class="text-[9px] text-gray-500">Reportó Falla</span>
                </div>
                <div>
                    <div class="border-b border-gray-400 h-10 mb-1"></div>
                    <span class="font-bold text-gray-900 block text-[10px]">MECÁNICO RESPONSABLE</span>
                    <span class="text-[9px] text-gray-500">Ejecutó + LOTO</span>
                </div>
                <div>
                    <div class="border-b border-gray-400 h-10 mb-1"></div>
                    <span class="font-bold text-gray-900 block text-[10px]">SUPERVISOR APT</span>
                    <span class="text-[9px] text-gray-500">Recibió &bull; Cierre Bitácora</span>
                </div>
                <div>
                    <div class="border-b border-gray-400 h-10 mb-1"></div>
                    <span class="font-bold text-gray-900 block text-[10px]">JEFE ALMACÉN APT</span>
                    <span class="text-[9px] text-gray-500">Autorizó OT</span>
                </div>
            </div>
        </div>

    </div>

</body>
</html>
