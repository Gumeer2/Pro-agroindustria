<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Gestión de Maquinarias - Proceso de Mantenimiento - Proagroindustria</title>
    <link rel="icon" type="image/png" href="{{ asset('Proagro.png') }}">
    <link rel="shortcut icon" type="image/png" href="{{ asset('Proagro.png') }}">
    <link rel="apple-touch-icon" href="{{ asset('Proagro.png') }}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        burgundy: {
                            50: '#fdf2f3',
                            100: '#fbe6e8',
                            200: '#f7cfd3',
                            300: '#f0abb3',
                            400: '#e57a87',
                            500: '#d44d5e',
                            600: '#bd3345',
                            700: '#9e2536',
                            800: '#832130',
                            900: '#6f202c',
                            950: '#400c14',
                        },
                    },
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    <style>
        :root {
            --burgundy-main: #6b0f1a;
            --burgundy-dark: #500a13;
            --burgundy-light: #881324;
            --warm-bg: #fbf7f4;
        }
        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--warm-bg);
            color: #1e293b;
        }
        .gear-bg {
            background-image: radial-gradient(rgba(107, 15, 26, 0.04) 2px, transparent 2px);
            background-size: 24px 24px;
        }
        .arrow-right-custom::after {
            content: '';
            position: absolute;
            right: -14px;
            top: 50%;
            transform: translateY(-50%);
            border-top: 7px solid transparent;
            border-bottom: 7px solid transparent;
            border-left: 12px solid #6b0f1a;
            z-index: 10;
        }
        .arrow-left-custom::after {
            content: '';
            position: absolute;
            left: -14px;
            top: 50%;
            transform: translateY(-50%);
            border-top: 7px solid transparent;
            border-bottom: 7px solid transparent;
            border-right: 12px solid #6b0f1a;
            z-index: 10;
        }
        @keyframes pulseSlow {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.85; transform: scale(1.02); }
        }
        .animate-pulse-slow {
            animation: pulseSlow 3s infinite ease-in-out;
        }
        /* Custom scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #f1f5f9;
        }
        ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
    </style>
</head>
<body class="min-h-screen flex flex-col gear-bg antialiased">

    <!-- Top Navigation Bar -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <!-- Left: Back Button & Title -->
                <div class="flex items-center space-x-4">
                    <a href="{{ $from === 'production' ? route('apt.production') : route('apt.index') }}"
                       class="inline-flex items-center text-gray-600 hover:text-burgundy-700 bg-gray-50 hover:bg-burgundy-50 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold transition-all group">
                        <i class="fa-solid fa-arrow-left mr-2 text-gray-400 group-hover:text-burgundy-700 group-hover:-translate-x-0.5 transition-transform"></i>
                        {{ $from === 'production' ? 'Volver a Gestión de almacenes' : 'Volver al Menú APT' }}
                    </a>
                    <div class="h-6 w-px bg-gray-300 hidden sm:block"></div>
                    <div class="flex items-center space-x-2">
                        <div class="w-9 h-9 rounded-lg bg-burgundy-100 text-burgundy-800 flex items-center justify-center font-bold text-lg">
                            <i class="fa-solid fa-wrench"></i>
                        </div>
                        <div>
                            <h1 class="text-base sm:text-lg font-bold text-gray-900 leading-tight">Gestión de Maquinarias</h1>
                            <p class="text-xs text-gray-500 hidden sm:block">Mantenimiento Preventivo y Correctivo de Maquinaria Operativa</p>
                        </div>
                    </div>
                </div>

                <!-- Right: Quick Actions & User -->
                <div class="flex items-center space-x-3">
                    <button onclick="openNewModal()" class="inline-flex items-center px-4 py-2 bg-burgundy-800 hover:bg-burgundy-900 text-white rounded-lg shadow-sm text-sm font-bold transition-all transform hover:-translate-y-0.5">
                        <i class="fa-solid fa-plus mr-2 text-xs"></i>
                        <span class="hidden sm:inline">Nuevo Reporte /</span> O.T.
                    </button>
                    @if(auth()->check())
                    <div class="hidden md:flex items-center pl-3 border-l border-gray-200 text-xs text-gray-500">
                        <i class="fa-solid fa-user-circle text-gray-400 text-base mr-1.5"></i>
                        <span class="font-medium text-gray-700">{{ auth()->user()->name }}</span>
                    </div>
                    @endif
                </div>
            </div>
        </div>
    </header>

    <!-- Main Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        @if(session('success'))
        <div class="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl shadow-sm flex items-center justify-between animate-fade-in">
            <div class="flex items-center space-x-3">
                <div class="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <i class="fa-solid fa-circle-check text-lg"></i>
                </div>
                <div>
                    <h4 class="text-sm font-bold text-emerald-900">Operación Exitosa</h4>
                    <p class="text-xs text-emerald-700">{{ session('success') }}</p>
                </div>
            </div>
            <button onclick="this.parentElement.remove()" class="text-emerald-400 hover:text-emerald-600">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        @endif

        <!-- Banner Principal Oficial (Exacto a las imágenes del usuario) -->
        <div class="bg-gradient-to-r from-burgundy-950 via-burgundy-900 to-burgundy-950 rounded-2xl shadow-xl overflow-hidden border border-burgundy-900 text-white relative">
            <!-- Decorative Gear Icons in Background -->
            <div class="absolute -right-10 -bottom-10 text-white/5 text-9xl pointer-events-none select-none">
                <i class="fa-solid fa-gear"></i>
            </div>
            <div class="absolute -left-6 -top-6 text-white/5 text-8xl pointer-events-none select-none">
                <i class="fa-solid fa-gears"></i>
            </div>

            <div class="relative z-10 px-6 sm:px-10 py-7 text-center">
                <div class="inline-flex items-center space-x-2 bg-burgundy-800/80 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold tracking-wider text-burgundy-200 uppercase mb-3 border border-burgundy-700/60">
                    <i class="fa-solid fa-shield-halved text-amber-400"></i>
                    <span>Norma Operativa GLS &bull; Proceso Oficial</span>
                </div>
                <h2 class="text-2xl sm:text-4xl font-black uppercase tracking-wider text-white drop-shadow-md">
                    PROCESO DE MANTENIMIENTO DE MAQUINARIA
                </h2>
                <p class="text-sm sm:text-lg text-burgundy-200 font-medium mt-1">
                    Control integral de mantenimiento preventivo por horómetro y correctivo con protocolo de seguridad LOTO
                </p>

                <!-- KPI Metric Pills inside Banner -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 max-w-4xl mx-auto text-left">
                    <div class="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                        <span class="block text-[11px] font-bold text-burgundy-200 uppercase tracking-wider">Flota de Maquinaria</span>
                        <div class="flex items-center justify-between mt-1">
                            <span class="text-2xl font-black text-white">{{ $metrics['total_machinery'] }}</span>
                            <span class="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">Unidades</span>
                        </div>
                    </div>
                    <div class="bg-red-500/20 backdrop-blur-md rounded-xl p-3 border border-red-500/30">
                        <span class="block text-[11px] font-bold text-red-200 uppercase tracking-wider">Status ROJO (Paro)</span>
                        <div class="flex items-center justify-between mt-1">
                            <span class="text-2xl font-black text-red-200">{{ $metrics['red_status_count'] }}</span>
                            <span class="text-xs bg-red-600/40 text-red-100 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <span class="w-2 h-2 rounded-full bg-red-400 animate-ping"></span> Activos
                            </span>
                        </div>
                    </div>
                    <div class="bg-amber-500/20 backdrop-blur-md rounded-xl p-3 border border-amber-500/30">
                        <span class="block text-[11px] font-bold text-amber-200 uppercase tracking-wider">Órdenes Abiertas (OT)</span>
                        <div class="flex items-center justify-between mt-1">
                            <span class="text-2xl font-black text-amber-200">{{ $metrics['open_orders_count'] }}</span>
                            <span class="text-xs bg-amber-600/40 text-amber-100 px-2 py-0.5 rounded-full font-bold">En Proceso</span>
                        </div>
                    </div>
                    <div class="bg-emerald-500/20 backdrop-blur-md rounded-xl p-3 border border-emerald-500/30">
                        <span class="block text-[11px] font-bold text-emerald-200 uppercase tracking-wider">Cierre Finalizado</span>
                        <div class="flex items-center justify-between mt-1">
                            <span class="text-2xl font-black text-emerald-200">{{ $metrics['completed_count'] }}</span>
                            <span class="text-xs bg-emerald-600/40 text-emerald-100 px-2 py-0.5 rounded-full font-bold">Cerrados</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab Navigation Bar -->
            <div class="bg-burgundy-950/90 border-t border-burgundy-900/80 px-4 sm:px-8 py-2 flex flex-wrap items-center justify-center gap-2 text-sm font-bold">
                <button onclick="switchTab('records')" id="tab-btn-records"
                        class="tab-btn px-4 py-2 rounded-lg transition-all flex items-center space-x-2 bg-white text-burgundy-950 shadow-md">
                    <i class="fa-solid fa-book-journal-whills"></i>
                    <span>Bitácora y Órdenes de Trabajo</span>
                    <span class="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-red-600 text-white">{{ $records->count() }}</span>
                </button>
                <button onclick="switchTab('matriz')" id="tab-btn-matriz"
                        class="tab-btn px-4 py-2 rounded-lg transition-all flex items-center space-x-2 text-burgundy-200 hover:text-white hover:bg-burgundy-900/60">
                    <i class="fa-solid fa-table-list"></i>
                    <span>Matriz Oficial de Responsables</span>
                </button>
                <button onclick="switchTab('flow-preventivo')" id="tab-btn-flow-preventivo"
                        class="tab-btn px-4 py-2 rounded-lg transition-all flex items-center space-x-2 text-burgundy-200 hover:text-white hover:bg-burgundy-900/60">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                    <span>Mantenimiento Preventivo (Horómetros)</span>
                </button>
            </div>
        </div>

        <!-- ========================================================================= -->
        <!-- TAB 2: FLUJO PREVENTIVO Y CORRECTIVO (8 PASOS - IDENTICO A IMAGEN 1)     -->
        <!-- ========================================================================= -->
        <section id="tab-content-flow-preventivo" class="tab-pane hidden space-y-6">
            <div class="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8 relative overflow-hidden">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
                    <div>
                        <div class="flex items-center space-x-2 text-burgundy-700 font-black uppercase text-sm tracking-widest">
                            <i class="fa-solid fa-clock"></i>
                            <span>Programa de Mantenimiento por Horómetro</span>
                        </div>
                        <h3 class="text-2xl font-black text-burgundy-900 mt-1">Mantenimiento preventivo y correctivo</h3>
                        <p class="text-xs sm:text-sm text-gray-500 mt-0.5">
                            Ciclo continuo de 8 etapas activado por horas trabajadas para asegurar disponibilidad de maquinaria pesada.
                        </p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                            <i class="fa-solid fa-gauge-high"></i> Monitoreo Activo de Horómetros
                        </span>
                    </div>
                </div>

                <!-- DIAGRAMA VISUAL 8 PASOS (Replicando Imagen 1 con pills y flechas) -->
                <div class="py-10 px-2 sm:px-6">
                    <!-- Top Row: 4 Steps (Left to Right) -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                        @for($i = 1; $i <= 4; $i++)
                        @php $step = $preventiveSteps[$i]; @endphp
                        <div class="relative bg-white rounded-3xl border-2 border-burgundy-800 p-6 flex flex-col items-center justify-center text-center shadow-md hover:shadow-xl hover:-translate-y-1 transition-all min-h-[140px]">
                            <div class="w-8 h-8 rounded-full bg-burgundy-100 text-burgundy-900 flex items-center justify-center font-bold text-xs mb-2">
                                <i class="fa-solid {{ $step['icon'] }}"></i>
                            </div>
                            <h4 class="text-sm font-extrabold text-burgundy-950 leading-snug">
                                {{ $step['title'] }}
                            </h4>
                            <span class="mt-2 text-[10px] font-bold text-burgundy-700 bg-burgundy-50 px-2 py-0.5 rounded-full border border-burgundy-200">
                                {{ $step['badge'] }}
                            </span>

                            @if($i < 4)
                            <!-- Arrow right -->
                            <div class="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-burgundy-800 text-white items-center justify-center text-xs shadow-md">
                                <i class="fa-solid fa-arrow-right"></i>
                            </div>
                            @else
                            <!-- Downward arrow at step 4 to step 5 -->
                            <div class="hidden lg:flex absolute right-1/2 -bottom-7 translate-x-1/2 z-20 w-8 h-8 rounded-full bg-burgundy-800 text-white items-center justify-center text-xs shadow-md">
                                <i class="fa-solid fa-arrow-down"></i>
                            </div>
                            @endif
                        </div>
                        @endfor
                    </div>

                    <!-- Spacer -->
                    <div class="h-8"></div>

                    <!-- Bottom Row: Steps 8, 7, 6, 5 (Right to Left flow like image 1) -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                        <!-- Step 8 (Final): Cierre proceso finalizado -->
                        <div class="relative bg-emerald-50 rounded-3xl border-2 border-emerald-700 p-6 flex flex-col items-center justify-center text-center shadow-md hover:shadow-xl hover:-translate-y-1 transition-all min-h-[140px]">
                            <div class="w-8 h-8 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold text-xs mb-2">
                                <i class="fa-solid fa-circle-check"></i>
                            </div>
                            <h4 class="text-sm font-extrabold text-emerald-950 leading-snug">
                                {{ $preventiveSteps[8]['title'] }}
                            </h4>
                            <span class="mt-2 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                Proceso Finalizado
                            </span>
                        </div>

                        <!-- Step 7: Firma de trabajo entregado y trabajo recibido -->
                        <div class="relative bg-white rounded-3xl border-2 border-burgundy-800 p-6 flex flex-col items-center justify-center text-center shadow-md hover:shadow-xl hover:-translate-y-1 transition-all min-h-[140px]">
                            <!-- Arrow pointing LEFT to Step 8 -->
                            <div class="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-burgundy-800 text-white items-center justify-center text-xs shadow-md">
                                <i class="fa-solid fa-arrow-left"></i>
                            </div>
                            <div class="w-8 h-8 rounded-full bg-burgundy-100 text-burgundy-900 flex items-center justify-center font-bold text-xs mb-2">
                                <i class="fa-solid fa-file-signature"></i>
                            </div>
                            <h4 class="text-sm font-extrabold text-burgundy-950 leading-snug">
                                {{ $preventiveSteps[7]['title'] }}
                            </h4>
                            <span class="mt-2 text-[10px] font-bold text-burgundy-700 bg-burgundy-50 px-2 py-0.5 rounded-full border border-burgundy-200">
                                {{ $preventiveSteps[7]['badge'] }}
                            </span>
                        </div>

                        <!-- Step 6: Reporte de trabajo ejecutado -->
                        <div class="relative bg-white rounded-3xl border-2 border-burgundy-800 p-6 flex flex-col items-center justify-center text-center shadow-md hover:shadow-xl hover:-translate-y-1 transition-all min-h-[140px]">
                            <!-- Arrow pointing LEFT to Step 7 -->
                            <div class="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-burgundy-800 text-white items-center justify-center text-xs shadow-md">
                                <i class="fa-solid fa-arrow-left"></i>
                            </div>
                            <div class="w-8 h-8 rounded-full bg-burgundy-100 text-burgundy-900 flex items-center justify-center font-bold text-xs mb-2">
                                <i class="fa-solid fa-file-lines"></i>
                            </div>
                            <h4 class="text-sm font-extrabold text-burgundy-950 leading-snug">
                                {{ $preventiveSteps[6]['title'] }}
                            </h4>
                            <span class="mt-2 text-[10px] font-bold text-burgundy-700 bg-burgundy-50 px-2 py-0.5 rounded-full border border-burgundy-200">
                                {{ $preventiveSteps[6]['badge'] }}
                            </span>
                        </div>

                        <!-- Step 5: Ejecución de mantenimiento -->
                        <div class="relative bg-white rounded-3xl border-2 border-burgundy-800 p-6 flex flex-col items-center justify-center text-center shadow-md hover:shadow-xl hover:-translate-y-1 transition-all min-h-[140px]">
                            <!-- Arrow pointing LEFT to Step 6 -->
                            <div class="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-burgundy-800 text-white items-center justify-center text-xs shadow-md">
                                <i class="fa-solid fa-arrow-left"></i>
                            </div>
                            <div class="w-8 h-8 rounded-full bg-burgundy-100 text-burgundy-900 flex items-center justify-center font-bold text-xs mb-2">
                                <i class="fa-solid fa-screwdriver-wrench"></i>
                            </div>
                            <h4 class="text-sm font-extrabold text-burgundy-950 leading-snug">
                                {{ $preventiveSteps[5]['title'] }}
                            </h4>
                            <span class="mt-2 text-[10px] font-bold text-burgundy-700 bg-burgundy-50 px-2 py-0.5 rounded-full border border-burgundy-200">
                                {{ $preventiveSteps[5]['badge'] }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Fleet Horometer Tracker Cards -->
                <div class="mt-8 pt-6 border-t border-gray-100">
                    <h4 class="text-sm font-bold uppercase tracking-wider text-gray-700 mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-gauge text-burgundy-700"></i>
                        <span>Estado de Horómetros de Maquinaria Operativa</span>
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        @foreach($fleet as $item)
                        @php
                            $progress = min(100, round(($item['hours'] / $item['next_service_hours']) * 100));
                        @endphp
                        <div class="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col justify-between">
                            <div>
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xs font-bold text-gray-500 font-mono">{{ $item['economic'] }}</span>
                                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border {{ $item['badge_color'] }}">
                                        {{ $item['status'] }}
                                    </span>
                                </div>
                                <h5 class="font-bold text-gray-900 text-sm">{{ $item['name'] }}</h5>
                                <p class="text-xs text-gray-500">{{ $item['type'] }}</p>
                            </div>
                            <div class="mt-4">
                                <div class="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                                    <span>Horómetro: <strong class="text-gray-900">{{ number_format($item['hours'], 1) }}h</strong></span>
                                    <span>Próx: {{ number_format($item['next_service_hours'], 1) }}h</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div class="h-2 rounded-full {{ $progress > 90 ? 'bg-red-500' : ($progress > 70 ? 'bg-amber-500' : 'bg-emerald-500') }}"
                                         style="width: {{ $progress }}%"></div>
                                </div>
                            </div>
                        </div>
                        @endforeach
                    </div>
                </div>
            </div>
        </section>

        <!-- ========================================================================= -->
        <!-- TAB 3: MATRIZ OFICIAL DE RESPONSABILIDADES (TABLA IDENTICA A IMAGEN 3)   -->
        <!-- ========================================================================= -->
        <section id="tab-content-matriz" class="tab-pane hidden space-y-6">
            <div class="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                <!-- Cyan/Blue Header Bar (Identico a la imagen PDF 2 del usuario) -->
                <div class="bg-sky-500 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 class="text-xl sm:text-2xl font-black uppercase text-white tracking-wider">
                            FLUJO PARA EL MANTENIMIENTO CORRECTIVO
                        </h3>
                        <p class="text-xs text-sky-100 font-medium mt-0.5">
                            Matriz de responsabilidades, descripción de actividades y entregables por etapa.
                        </p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button onclick="window.print()" class="px-3.5 py-1.5 bg-white text-sky-700 hover:bg-sky-50 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5">
                            <i class="fa-solid fa-print"></i>
                            <span>Imprimir Matriz</span>
                        </button>
                    </div>
                </div>

                <!-- Filter Pills by Responsible -->
                <div class="bg-gray-50 px-6 py-3 border-b border-gray-200 flex flex-wrap items-center gap-2 text-xs">
                    <span class="font-bold text-gray-600 mr-2">Filtrar por Responsable:</span>
                    <button onclick="filterMatrix('all')" class="matrix-filter-btn px-2.5 py-1 rounded-md font-bold bg-sky-600 text-white">Todos (10)</button>
                    <button onclick="filterMatrix('OPERADOR DE MAQ.')" class="matrix-filter-btn px-2.5 py-1 rounded-md font-bold bg-white text-gray-700 hover:bg-gray-100 border border-gray-200">Operador de Maq.</button>
                    <button onclick="filterMatrix('SUPERVISOR APT')" class="matrix-filter-btn px-2.5 py-1 rounded-md font-bold bg-white text-gray-700 hover:bg-gray-100 border border-gray-200">Supervisor APT</button>
                    <button onclick="filterMatrix('MECANICO')" class="matrix-filter-btn px-2.5 py-1 rounded-md font-bold bg-white text-gray-700 hover:bg-gray-100 border border-gray-200">Mecánico</button>
                    <button onclick="filterMatrix('SUP. APT. + MECANICO')" class="matrix-filter-btn px-2.5 py-1 rounded-md font-bold bg-white text-gray-700 hover:bg-gray-100 border border-gray-200">Sup. APT + Mecánico</button>
                    <button onclick="filterMatrix('JEFE APT')" class="matrix-filter-btn px-2.5 py-1 rounded-md font-bold bg-white text-gray-700 hover:bg-gray-100 border border-gray-200">Jefe APT</button>
                </div>

                <!-- Official Table matching PDF 2 -->
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 text-left" id="matrix-table">
                        <thead class="bg-gray-100">
                            <tr>
                                <th scope="col" class="px-6 py-3.5 text-xs font-black text-gray-800 uppercase tracking-wider w-1/4 border-r border-gray-200">
                                    PASO
                                </th>
                                <th scope="col" class="px-6 py-3.5 text-xs font-black text-gray-800 uppercase tracking-wider w-1/2 border-r border-gray-200">
                                    DESCRIPCIÓN
                                </th>
                                <th scope="col" class="px-6 py-3.5 text-xs font-black text-gray-800 uppercase tracking-wider w-1/4">
                                    RESPONSABLE
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            @foreach($correctiveSteps as $stepNumber => $step)
                            <tr class="matrix-row hover:bg-sky-50/50 transition-colors" data-responsible="{{ $step['responsible'] }}">
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-gray-900 border-r border-gray-200">
                                    <div class="flex items-center space-x-2">
                                        <span class="w-6 h-6 rounded-full bg-burgundy-800 text-white flex items-center justify-center font-black text-xs shrink-0">
                                            {{ $stepNumber }}
                                        </span>
                                        <span>{{ $stepNumber }}.- {{ strtoupper(str_replace('por operador', '', $step['title'])) }}</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-sm font-bold text-gray-700 border-r border-gray-200 uppercase">
                                    {{ $step['description'] }}
                                    <span class="block text-xs font-normal text-gray-500 normal-case mt-0.5">
                                        {{ $step['detail'] }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-burgundy-900 uppercase">
                                    <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold
                                        @if($step['responsible'] === 'OPERADOR DE MAQ.') bg-amber-50 text-amber-800 border border-amber-200
                                        @elseif($step['responsible'] === 'SUPERVISOR APT') bg-blue-50 text-blue-800 border border-blue-200
                                        @elseif($step['responsible'] === 'MECANICO') bg-purple-50 text-purple-800 border border-purple-200
                                        @elseif($step['responsible'] === 'JEFE APT') bg-rose-50 text-rose-800 border border-rose-200
                                        @else bg-emerald-50 text-emerald-800 border border-emerald-200
                                        @endif">
                                        <i class="fa-solid fa-user-gear mr-1.5 text-[10px]"></i>
                                        {{ $step['responsible'] }}
                                    </span>
                                </td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>

                <div class="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <span>Proceso oficial alineado al manual de mantenimiento de maquinaria pesada GLS-AP.</span>
                    <span class="font-bold text-burgundy-800">10 Pasos Estandarizados &bull; Cierre con Firma Mancomunada</span>
                </div>
            </div>
        </section>

        <!-- ========================================================================= -->
        <!-- TAB 4: BITACORA Y SEGUIMIENTO DE ORDENES DE TRABAJO (SISTEMA VIVO)       -->
        <!-- ========================================================================= -->
        <section id="tab-content-records" class="tab-pane space-y-6">
            
            <!-- Fleet Status Quick Overview -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                @foreach($fleet as $machinery)
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div class="flex items-start justify-between">
                        <div class="w-10 h-10 rounded-lg {{ $machinery['status'] === 'ROJO' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600' }} flex items-center justify-center text-lg">
                            <i class="fa-solid {{ $machinery['icon'] }}"></i>
                        </div>
                        <span class="px-2 py-0.5 rounded-full text-[11px] font-black border {{ $machinery['badge_color'] }}">
                            {{ $machinery['status'] === 'ROJO' ? 'Status ROJO' : 'Operativo' }}
                        </span>
                    </div>
                    <h4 class="font-black text-gray-900 mt-3 text-base">{{ $machinery['name'] }}</h4>
                    <p class="text-xs text-gray-500 font-medium">{{ $machinery['type'] }} &bull; No. {{ $machinery['economic'] }}</p>
                    <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span class="text-gray-500">Horómetro:</span>
                        <span class="font-bold text-gray-800">{{ number_format($machinery['hours'], 1) }} hrs</span>
                    </div>
                </div>
                @endforeach
            </div>

            <!-- Maintenance Orders Table & Search Filter -->
            <div class="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                <div class="p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 class="text-lg font-black text-gray-900 flex items-center gap-2">
                            <i class="fa-solid fa-list-check text-burgundy-700"></i>
                            <span>Bitácora de Órdenes de Mantenimiento</span>
                        </h3>
                        <p class="text-xs text-gray-500">Registro histórico y seguimiento en tiempo real del flujo de 10 pasos</p>
                    </div>

                    <div class="flex flex-wrap items-center gap-3">
                        <form method="GET" action="{{ route('apt.machinery') }}" class="flex items-center gap-2">
                            <input type="hidden" name="from" value="{{ $from }}">
                            <input type="hidden" name="tab" value="records">
                            <div class="relative">
                                <i class="fa-solid fa-search absolute left-3 top-2.5 text-gray-400 text-xs"></i>
                                <input type="text" name="search" value="{{ $filters['search'] ?? '' }}"
                                       placeholder="Buscar folio, equipo, falla..."
                                       class="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:border-burgundy-700 focus:ring-1 focus:ring-burgundy-700">
                            </div>
                            <select name="type" onchange="this.form.submit()" class="py-1.5 px-3 text-xs rounded-lg border border-gray-300 bg-white font-medium">
                                <option value="all" {{ ($filters['type'] ?? '') === 'all' ? 'selected' : '' }}>Todos los Tipos</option>
                                <option value="correctivo" {{ ($filters['type'] ?? '') === 'correctivo' ? 'selected' : '' }}>Correctivo</option>
                                <option value="preventivo" {{ ($filters['type'] ?? '') === 'preventivo' ? 'selected' : '' }}>Preventivo</option>
                            </select>
                        </form>
                        <button onclick="openNewModal()" class="px-3.5 py-1.5 bg-burgundy-800 hover:bg-burgundy-900 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5">
                            <i class="fa-solid fa-plus"></i>
                            <span>Nueva Orden</span>
                        </button>
                    </div>
                </div>

                <!-- Table -->
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 text-left">
                        <thead class="bg-gray-50 text-xs font-black text-gray-600 uppercase tracking-wider">
                            <tr>
                                <th class="px-5 py-3">Folio O.T.</th>
                                <th class="px-5 py-3">Maquinaria</th>
                                <th class="px-5 py-3">Tipo / Horómetro</th>
                                <th class="px-5 py-3">Paso Actual (1 al 10)</th>
                                <th class="px-5 py-3">Status</th>
                                <th class="px-5 py-3">Reportó</th>
                                <th class="px-5 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 text-xs">
                            @forelse($records as $rec)
                            <tr class="hover:bg-burgundy-50/30 transition-colors">
                                <!-- Folio -->
                                <td class="px-5 py-4 whitespace-nowrap font-mono font-bold text-burgundy-900">
                                    <div class="flex items-center gap-1.5">
                                        <i class="fa-solid fa-file-lines text-gray-400"></i>
                                        <span>{{ $rec->folio }}</span>
                                    </div>
                                    <span class="text-[10px] text-gray-400 block font-sans">{{ $rec->created_at->format('d/m/Y H:i') }}</span>
                                </td>

                                <!-- Maquinaria -->
                                <td class="px-5 py-4">
                                    <div class="font-bold text-gray-900">{{ $rec->machinery_name }}</div>
                                    <span class="text-[11px] text-gray-500 font-mono">{{ $rec->economic_number ? 'No. ' . $rec->economic_number : '' }}</span>
                                </td>

                                <!-- Tipo / Horómetro -->
                                <td class="px-5 py-4 whitespace-nowrap">
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase
                                        {{ $rec->type === 'correctivo' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200' }}">
                                        {{ $rec->type }}
                                    </span>
                                    @if($rec->hours_worked)
                                    <span class="block text-[11px] text-gray-600 font-mono mt-0.5">
                                        {{ number_format($rec->hours_worked, 1) }} hrs
                                    </span>
                                    @endif
                                </td>

                                <!-- Paso Actual con barra de progreso -->
                                <td class="px-5 py-4 min-w-[220px]">
                                    <div class="flex items-center justify-between text-xs font-bold text-burgundy-950 mb-1">
                                        <span>Paso {{ $rec->current_step }} de 10</span>
                                        <span class="text-[10px] text-gray-500 font-normal">
                                            {{ $correctiveSteps[$rec->current_step]['title'] ?? '' }}
                                        </span>
                                    </div>
                                    <!-- Progress Segment Bar -->
                                    <div class="grid grid-cols-10 gap-0.5 bg-gray-100 p-0.5 rounded-full border border-gray-200">
                                        @for($s = 1; $s <= 10; $s++)
                                        <div class="h-1.5 rounded-full {{ $s <= $rec->current_step ? ($rec->current_step === 10 ? 'bg-emerald-600' : 'bg-burgundy-800') : 'bg-gray-200' }}"></div>
                                        @endfor
                                    </div>
                                    @if($rec->loto_applied)
                                    <span class="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                        <i class="fa-solid fa-lock text-[9px]"></i> LOTO Activo: {{ $rec->loto_tag_number ?? 'Sí' }}
                                    </span>
                                    @endif
                                </td>

                                <!-- Status Badge -->
                                <td class="px-5 py-4 whitespace-nowrap">
                                    @if($rec->current_step === 10)
                                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        <i class="fa-solid fa-circle-check mr-1 text-[10px]"></i> Proceso Finalizado
                                    </span>
                                    @else
                                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse-slow">
                                        <span class="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span> Status ROJO
                                    </span>
                                    @endif
                                </td>

                                <!-- Operator / Supervisor -->
                                <td class="px-5 py-4">
                                    <div class="font-medium text-gray-800">{{ $rec->operator_name ?? 'N/A' }}</div>
                                    <span class="text-[10px] text-gray-500 line-clamp-1" title="{{ $rec->failure_description }}">
                                        {{ $rec->failure_description }}
                                    </span>
                                </td>

                                <!-- Actions -->
                                <td class="px-5 py-4 whitespace-nowrap text-right space-x-1">
                                    <button onclick="openStepModal({{ json_encode($rec) }})"
                                            class="inline-flex items-center px-2.5 py-1 bg-burgundy-50 hover:bg-burgundy-100 text-burgundy-900 rounded font-bold transition-colors border border-burgundy-200"
                                            title="Ver detalle y avanzar paso">
                                        <i class="fa-solid fa-arrow-right-arrow-left mr-1"></i> Avanzar
                                    </button>
                                    <a href="{{ route('apt.machinery.print', $rec->id) }}" target="_blank"
                                       class="inline-flex items-center px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded font-bold transition-colors border border-gray-200"
                                       title="Imprimir Orden de Trabajo">
                                        <i class="fa-solid fa-print"></i>
                                    </a>
                                    <form method="POST" action="{{ route('apt.machinery.destroy', $rec->id) }}" class="inline" onsubmit="return confirm('¿Seguro de eliminar este registro?')">
                                        @csrf
                                        @method('DELETE')
                                        <input type="hidden" name="from" value="{{ $from }}">
                                        <button type="submit" class="inline-flex items-center p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50 transition-colors" title="Eliminar">
                                            <i class="fa-solid fa-trash-can"></i>
                                        </button>
                                    </form>
                                </td>
                            </tr>
                            @empty
                            <tr>
                                <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                                    <i class="fa-solid fa-wrench text-gray-300 text-4xl mb-3 block"></i>
                                    <p class="text-base font-bold text-gray-700">No hay registros de mantenimiento activos</p>
                                    <p class="text-xs text-gray-500 mt-1">Crea un nuevo reporte con el botón superior para iniciar el flujo de 10 pasos.</p>
                                </td>
                            </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    </main>

    <!-- ========================================================================= -->
    <!-- MODAL 1: REGISTRAR NUEVA FALLA / ORDEN DE TRABAJO (PASO 1)               -->
    <!-- ========================================================================= -->
    <div id="modal-new-report" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-200 animate-fade-in">
            <!-- Modal Header -->
            <div class="bg-gradient-to-r from-burgundy-950 to-burgundy-900 px-6 py-4 text-white flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 rounded-lg bg-burgundy-800 flex items-center justify-center font-bold">
                        <i class="fa-solid fa-triangle-exclamation text-amber-400"></i>
                    </div>
                    <div>
                        <h3 class="font-black text-base">Nuevo Reporte de Falla / Mantenimiento</h3>
                        <p class="text-xs text-burgundy-200">Inicia el flujo oficial en Paso 1 (Reporte de Falla y Status ROJO)</p>
                    </div>
                </div>
                <button onclick="closeNewModal()" class="text-burgundy-300 hover:text-white text-lg">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <!-- Modal Form -->
            <form method="POST" action="{{ route('apt.machinery.store') }}" class="p-6 space-y-4">
                @csrf
                <input type="hidden" name="from" value="{{ $from }}">

                <!-- Maquinaria Selector -->
                <div>
                    <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Maquinaria Afectada *</label>
                    <select name="machinery_name" id="new_machinery_name" onchange="autoFillMachinery(this.value)" required
                            class="w-full text-sm rounded-lg border-gray-300 focus:border-burgundy-700 focus:ring-1 focus:ring-burgundy-700 py-2">
                        <option value="">Selecciona maquinaria...</option>
                        @foreach($fleet as $item)
                        <option value="{{ $item['name'] }}" data-code="{{ $item['code'] }}" data-economic="{{ $item['economic'] }}" data-hours="{{ $item['hours'] }}">
                            {{ $item['name'] }} &bull; {{ $item['type'] }} ({{ $item['economic'] }})
                        </option>
                        @endforeach
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-bold text-gray-700 uppercase mb-1">No. Económico</label>
                        <input type="text" name="economic_number" id="new_economic_number" placeholder="Ej: CF-01"
                               class="w-full text-sm rounded-lg border-gray-300 focus:border-burgundy-700 focus:ring-1 focus:ring-burgundy-700 py-2">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Código de Catálogo</label>
                        <input type="text" name="machinery_code" id="new_machinery_code" placeholder="Ej: 2010001"
                               class="w-full text-sm rounded-lg border-gray-300 focus:border-burgundy-700 focus:ring-1 focus:ring-burgundy-700 py-2 font-mono">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo de Mantenimiento *</label>
                        <select name="type" required class="w-full text-sm rounded-lg border-gray-300 focus:border-burgundy-700 focus:ring-1 focus:ring-burgundy-700 py-2">
                            <option value="correctivo">Correctivo (Status ROJO)</option>
                            <option value="preventivo">Preventivo (Horómetro)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Horómetro Actual (Horas)</label>
                        <input type="number" step="0.1" name="hours_worked" id="new_hours_worked" placeholder="Ej: 3450.5"
                               class="w-full text-sm rounded-lg border-gray-300 focus:border-burgundy-700 focus:ring-1 focus:ring-burgundy-700 py-2">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Operador que Reporta *</label>
                    <input type="text" name="operator_name" required value="{{ auth()->user()->name ?? '' }}" placeholder="Nombre del operador del equipo"
                           class="w-full text-sm rounded-lg border-gray-300 focus:border-burgundy-700 focus:ring-1 focus:ring-burgundy-700 py-2">
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Descripción de la Falla / Anomalía *</label>
                    <textarea name="failure_description" rows="3" required placeholder="Describe los síntomas, ruidos, fugas o alertas en tablero..."
                              class="w-full text-sm rounded-lg border-gray-300 focus:border-burgundy-700 focus:ring-1 focus:ring-burgundy-700 p-2.5"></textarea>
                </div>

                <div class="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 flex items-start space-x-2">
                    <i class="fa-solid fa-triangle-exclamation text-red-600 mt-0.5"></i>
                    <div>
                        <strong class="font-bold">Protocolo de Seguridad:</strong> Al registrar este reporte, la unidad se declarará en <strong>Status ROJO</strong> en la bitácora de almacén hasta que concluya el proceso de 10 pasos.
                    </div>
                </div>

                <!-- Actions -->
                <div class="pt-4 border-t border-gray-100 flex items-center justify-end space-x-2">
                    <button type="button" onclick="closeNewModal()" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" class="px-5 py-2 bg-burgundy-800 hover:bg-burgundy-900 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5">
                        <i class="fa-solid fa-check"></i>
                        <span>Generar Reporte &bull; Status ROJO</span>
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL 2: AVANZAR PASO / ACTUALIZAR DETALLES DE LA ORDEN                  -->
    <!-- ========================================================================= -->
    <div id="modal-step-updater" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 animate-fade-in">
            <!-- Modal Header -->
            <div class="bg-gradient-to-r from-burgundy-950 to-burgundy-900 px-6 py-4 text-white flex items-center justify-between sticky top-0 z-20">
                <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 rounded-lg bg-burgundy-800 flex items-center justify-center font-bold">
                        <i class="fa-solid fa-stairs text-amber-400"></i>
                    </div>
                    <div>
                        <h3 class="font-black text-base">Avanzar Proceso &bull; <span id="modal-step-folio"></span></h3>
                        <p class="text-xs text-burgundy-200" id="modal-step-machinery"></p>
                    </div>
                </div>
                <button onclick="closeStepModal()" class="text-burgundy-300 hover:text-white text-lg">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <form id="step-updater-form" method="POST" action="" class="p-6 space-y-4">
                @csrf
                @method('PATCH')
                <input type="hidden" name="from" value="{{ $from }}">

                <!-- Selector de Paso Objetivo -->
                <div>
                    <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Seleccionar Paso a Actualizar / Registrar</label>
                    <select name="step" id="updater-step-select" onchange="showStepSection(this.value)"
                            class="w-full text-sm font-bold text-burgundy-900 rounded-lg border-gray-300 focus:border-burgundy-700 focus:ring-1 focus:ring-burgundy-700 py-2">
                        @foreach($correctiveSteps as $num => $st)
                        <option value="{{ $num }}">Paso {{ $num }}: {{ $st['title'] }} ({{ $st['responsible'] }})</option>
                        @endforeach
                    </select>
                </div>

                <!-- Paso 2: Supervisor Bitacora -->
                <div id="step-section-2" class="step-field-group p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div class="text-xs font-bold text-burgundy-900 flex items-center gap-1.5 border-b pb-2">
                        <i class="fa-solid fa-book-bookmark"></i>
                        <span>Paso 2: Registro en Bitácora (Supervisor APT)</span>
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Nombre del Supervisor APT</label>
                        <input type="text" name="supervisor_name" id="field_supervisor_name" value="Ing. Roberto Sánchez (Supervisor APT)" class="w-full text-xs rounded-lg border-gray-300 py-2">
                    </div>
                </div>

                <!-- Paso 3: Diagnostico y P/N -->
                <div id="step-section-3" class="step-field-group p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div class="text-xs font-bold text-burgundy-900 flex items-center gap-1.5 border-b pb-2">
                        <i class="fa-solid fa-stethoscope"></i>
                        <span>Paso 3: Diagnóstico Técnico y P/N (Mecánico)</span>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Mecánico Asignado</label>
                            <input type="text" name="mechanic_name" id="field_mechanic_name" placeholder="Mec. Pedro Ramírez" class="w-full text-xs rounded-lg border-gray-300 py-2">
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Número de Parte (P/N)</label>
                            <input type="text" name="part_number" id="field_part_number" placeholder="Ej: 938-TH-4421 / P/N-001" class="w-full text-xs rounded-lg border-gray-300 py-2 font-mono">
                        </div>
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Diagnóstico / Revisión Visual</label>
                        <textarea name="diagnostic_notes" id="field_diagnostic_notes" rows="2" placeholder="Detalle técnico de los componentes dañados..." class="w-full text-xs rounded-lg border-gray-300 p-2"></textarea>
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Refacciones Solicitadas</label>
                        <input type="text" name="parts_requested" id="field_parts_requested" placeholder="Lista de refacciones requeridas..." class="w-full text-xs rounded-lg border-gray-300 py-2">
                    </div>
                </div>

                <!-- Paso 4: OT + Permiso Trabajo -->
                <div id="step-section-4" class="step-field-group p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div class="text-xs font-bold text-burgundy-900 flex items-center gap-1.5 border-b pb-2">
                        <i class="fa-solid fa-file-invoice-dollar"></i>
                        <span>Paso 4: Generar OT y Justificación (Causa y Raíz + Costo)</span>
                    </div>
                    <div class="grid grid-cols-3 gap-3">
                        <div>
                            <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Folio O.T.</label>
                            <input type="text" name="work_order_folio" id="field_work_order_folio" placeholder="OT-2026-..." class="w-full text-xs rounded-lg border-gray-300 py-2 font-mono">
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Permiso Trabajo</label>
                            <input type="text" name="work_permit_number" id="field_work_permit_number" placeholder="PT-MEC-2026-..." class="w-full text-xs rounded-lg border-gray-300 py-2 font-mono">
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Costo Estimado ($ MXN)</label>
                            <input type="number" step="0.01" name="estimated_cost" id="field_estimated_cost" placeholder="4850.00" class="w-full text-xs rounded-lg border-gray-300 py-2">
                        </div>
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Causa Raíz de la Falla</label>
                        <textarea name="root_cause" id="field_root_cause" rows="2" placeholder="Análisis causa-raíz del daño mecánico..." class="w-full text-xs rounded-lg border-gray-300 p-2"></textarea>
                    </div>
                </div>

                <!-- Paso 5: Autorización Jefe APT -->
                <div id="step-section-5" class="step-field-group p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div class="text-xs font-bold text-burgundy-900 flex items-center gap-1.5 border-b pb-2">
                        <i class="fa-solid fa-signature"></i>
                        <span>Paso 5: Autorización y Compra (Jefe APT)</span>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Autorizado Por</label>
                            <input type="text" name="authorized_by" id="field_authorized_by" value="Jefe de Almacén APT" class="w-full text-xs rounded-lg border-gray-300 py-2">
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">No. Orden de Compra</label>
                            <input type="text" name="purchase_order_number" id="field_purchase_order_number" placeholder="OC-REF-2026-..." class="w-full text-xs rounded-lg border-gray-300 py-2 font-mono">
                        </div>
                    </div>
                </div>

                <!-- Paso 6: Entrega Refacciones -->
                <div id="step-section-6" class="step-field-group p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div class="text-xs font-bold text-burgundy-900 flex items-center gap-1.5 border-b pb-2">
                        <i class="fa-solid fa-box-open"></i>
                        <span>Paso 6: Entrega de Refacciones al Mecánico</span>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Entregado Por (Almacén)</label>
                            <input type="text" name="parts_delivered_by" id="field_parts_delivered_by" value="Almacén de Refacciones APT" class="w-full text-xs rounded-lg border-gray-300 py-2">
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Notas de Entrega</label>
                            <input type="text" name="parts_delivery_notes" id="field_parts_delivery_notes" placeholder="Piezas completas y verificadas" class="w-full text-xs rounded-lg border-gray-300 py-2">
                        </div>
                    </div>
                </div>

                <!-- Paso 7: Ejecución + LOTO -->
                <div id="step-section-7" class="step-field-group p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div class="text-xs font-bold text-burgundy-900 flex items-center gap-1.5 border-b pb-2">
                        <i class="fa-solid fa-lock"></i>
                        <span>Paso 7: Ejecución de Mantenimiento + Protocolo LOTO</span>
                    </div>
                    <div class="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-center gap-3">
                        <input type="checkbox" name="loto_applied" id="field_loto_applied" value="1" class="rounded text-amber-600 focus:ring-amber-500 h-4 w-4">
                        <label for="field_loto_applied" class="text-xs font-bold text-amber-900">
                            Protocolo LOTO Aplicado (Bloqueo y Etiquetado contra arranque)
                        </label>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">No. de Candado / Tarjeta LOTO</label>
                            <input type="text" name="loto_tag_number" id="field_loto_tag_number" placeholder="LOTO-APT-CANDADO-..." class="w-full text-xs rounded-lg border-gray-300 py-2 font-mono">
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Notas de Ejecución</label>
                            <input type="text" name="execution_notes" id="field_execution_notes" placeholder="Trabajo en progreso..." class="w-full text-xs rounded-lg border-gray-300 py-2">
                        </div>
                    </div>
                </div>

                <!-- Paso 8: Reporte de Trabajo -->
                <div id="step-section-8" class="step-field-group p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div class="text-xs font-bold text-burgundy-900 flex items-center gap-1.5 border-b pb-2">
                        <i class="fa-solid fa-clipboard-check"></i>
                        <span>Paso 8: Reporte de Trabajo Ejecutado</span>
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Actividades Realizadas</label>
                        <textarea name="activities_performed" id="field_activities_performed" rows="2" placeholder="Detalle de trabajos concluidos..." class="w-full text-xs rounded-lg border-gray-300 p-2"></textarea>
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Refacciones Realmente Utilizadas</label>
                        <input type="text" name="parts_actually_used" id="field_parts_actually_used" placeholder="Refacciones consumidas en el trabajo..." class="w-full text-xs rounded-lg border-gray-300 py-2">
                    </div>
                </div>

                <!-- Paso 9: Firma Entrega y Recepción -->
                <div id="step-section-9" class="step-field-group p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div class="text-xs font-bold text-burgundy-900 flex items-center gap-1.5 border-b pb-2">
                        <i class="fa-solid fa-handshake"></i>
                        <span>Paso 9: Firma Entrega y Recepción (Prueba Operativa)</span>
                    </div>
                    <div class="bg-emerald-50 p-3 rounded-lg border border-emerald-200 flex items-center gap-3">
                        <input type="checkbox" name="operational_test_passed" id="field_operational_test_passed" value="1" class="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4">
                        <label for="field_operational_test_passed" class="text-xs font-bold text-emerald-900">
                            Prueba Operativa Superada al 100% (Equipo Funcional en Patio)
                        </label>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Firma Entregado (Mecánico)</label>
                            <input type="text" name="delivered_by" id="field_delivered_by" placeholder="Nombre de quien entrega..." class="w-full text-xs rounded-lg border-gray-300 py-2">
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Firma Recibido (Supervisor)</label>
                            <input type="text" name="received_by" id="field_received_by" placeholder="Nombre de quien recibe..." class="w-full text-xs rounded-lg border-gray-300 py-2">
                        </div>
                    </div>
                </div>

                <!-- Paso 10: Cierre y Archivo -->
                <div id="step-section-10" class="step-field-group p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
                    <div class="text-xs font-bold text-emerald-950 flex items-center gap-1.5 border-b border-emerald-200 pb-2">
                        <i class="fa-solid fa-circle-check text-emerald-600"></i>
                        <span>Paso 10: Cierre Proceso Finalizado (Se Archiva Reporte)</span>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[11px] font-bold text-emerald-900 uppercase mb-1">Cerrado Por (Supervisor APT)</label>
                            <input type="text" name="closed_by" id="field_closed_by" value="{{ auth()->user()->name ?? 'Supervisor APT' }}" class="w-full text-xs rounded-lg border-emerald-300 py-2">
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-emerald-900 uppercase mb-1">Observaciones de Cierre</label>
                            <input type="text" name="closure_notes" id="field_closure_notes" value="Reporte finalizado y archivado. Equipo liberado a Status VERDE." class="w-full text-xs rounded-lg border-emerald-300 py-2">
                        </div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span class="text-xs text-gray-500">
                        <i class="fa-solid fa-circle-info text-burgundy-700"></i> Actualiza el registro según el avance en taller.
                    </span>
                    <div class="flex items-center space-x-2">
                        <button type="button" onclick="closeStepModal()" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" class="px-5 py-2 bg-burgundy-800 hover:bg-burgundy-900 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5">
                            <i class="fa-solid fa-save"></i>
                            <span>Guardar Avance</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>

    <!-- Scripts -->
    <script>
        // Tab Switcher
        function switchTab(tabId) {
            document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
            const target = document.getElementById('tab-content-' + tabId);
            if (target) target.classList.remove('hidden');

            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('bg-white', 'text-burgundy-950', 'shadow-md');
                btn.classList.add('text-burgundy-200', 'hover:text-white', 'hover:bg-burgundy-900/60');
            });

            const activeBtn = document.getElementById('tab-btn-' + tabId);
            if (activeBtn) {
                activeBtn.classList.add('bg-white', 'text-burgundy-950', 'shadow-md');
                activeBtn.classList.remove('text-burgundy-200', 'hover:text-white', 'hover:bg-burgundy-900/60');
            }

            // Update URL query without full reload
            const url = new URL(window.location);
            url.searchParams.set('tab', tabId);
            window.history.replaceState({}, '', url);
        }

        // Initialize active tab from query param
        document.addEventListener('DOMContentLoaded', () => {
            const params = new URLSearchParams(window.location.search);
            const activeTab = params.get('tab') || 'records';
            switchTab(activeTab);
        });

        // Matrix Filter
        function filterMatrix(role) {
            document.querySelectorAll('.matrix-filter-btn').forEach(b => {
                b.classList.remove('bg-sky-600', 'text-white');
                b.classList.add('bg-white', 'text-gray-700');
            });
            event.target.classList.add('bg-sky-600', 'text-white');
            event.target.classList.remove('bg-white', 'text-gray-700');

            document.querySelectorAll('.matrix-row').forEach(row => {
                if (role === 'all' || row.dataset.responsible === role) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }

        // Modal 1: New Report
        function openNewModal() {
            document.getElementById('modal-new-report').classList.remove('hidden');
        }
        function closeNewModal() {
            document.getElementById('modal-new-report').classList.add('hidden');
        }

        function autoFillMachinery(name) {
            const select = document.getElementById('new_machinery_name');
            const opt = select.options[select.selectedIndex];
            if (opt) {
                document.getElementById('new_economic_number').value = opt.dataset.economic || '';
                document.getElementById('new_machinery_code').value = opt.dataset.code || '';
                document.getElementById('new_hours_worked').value = opt.dataset.hours || '';
            }
        }

        // Modal 2: Step Updater
        function openStepModal(record) {
            const form = document.getElementById('step-updater-form');
            form.action = `/apt/machinery/${record.id}/step`;

            document.getElementById('modal-step-folio').innerText = record.folio;
            document.getElementById('modal-step-machinery').innerText = `${record.machinery_name} - Paso Actual: ${record.current_step}`;

            const nextStep = Math.min(10, (record.current_step || 1) + 1);
            document.getElementById('updater-step-select').value = nextStep;

            // Pre-fill existing data
            if (record.supervisor_name) document.getElementById('field_supervisor_name').value = record.supervisor_name;
            if (record.mechanic_name) document.getElementById('field_mechanic_name').value = record.mechanic_name;
            if (record.part_number) document.getElementById('field_part_number').value = record.part_number;
            if (record.diagnostic_notes) document.getElementById('field_diagnostic_notes').value = record.diagnostic_notes;
            if (record.parts_requested) document.getElementById('field_parts_requested').value = record.parts_requested;
            if (record.work_order_folio) document.getElementById('field_work_order_folio').value = record.work_order_folio;
            if (record.work_permit_number) document.getElementById('field_work_permit_number').value = record.work_permit_number;
            if (record.estimated_cost) document.getElementById('field_estimated_cost').value = record.estimated_cost;
            if (record.root_cause) document.getElementById('field_root_cause').value = record.root_cause;
            if (record.authorized_by) document.getElementById('field_authorized_by').value = record.authorized_by;
            if (record.purchase_order_number) document.getElementById('field_purchase_order_number').value = record.purchase_order_number;
            if (record.parts_delivered_by) document.getElementById('field_parts_delivered_by').value = record.parts_delivered_by;
            if (record.loto_applied) document.getElementById('field_loto_applied').checked = true;
            if (record.loto_tag_number) document.getElementById('field_loto_tag_number').value = record.loto_tag_number;
            if (record.activities_performed) document.getElementById('field_activities_performed').value = record.activities_performed;
            if (record.parts_actually_used) document.getElementById('field_parts_actually_used').value = record.parts_actually_used;
            if (record.operational_test_passed) document.getElementById('field_operational_test_passed').checked = true;
            if (record.delivered_by) document.getElementById('field_delivered_by').value = record.delivered_by;
            if (record.received_by) document.getElementById('field_received_by').value = record.received_by;
            if (record.closed_by) document.getElementById('field_closed_by').value = record.closed_by;

            showStepSection(nextStep);
            document.getElementById('modal-step-updater').classList.remove('hidden');
        }

        function closeStepModal() {
            document.getElementById('modal-step-updater').classList.add('hidden');
        }

        function showStepSection(stepNum) {
            document.querySelectorAll('.step-field-group').forEach(el => el.classList.remove('ring-2', 'ring-burgundy-700', 'bg-burgundy-50/50'));
            const target = document.getElementById('step-section-' + stepNum);
            if (target) {
                target.classList.add('ring-2', 'ring-burgundy-700', 'bg-burgundy-50/50');
                target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    </script>
</body>
</html>
