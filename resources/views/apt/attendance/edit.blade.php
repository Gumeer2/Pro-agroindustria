<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Modificar Control de Asistencias - {{ $attendance->folio ?: 'GLS-AP-FO-005' }}</title>
    <link rel="icon" type="image/png" href="{{ asset('Proagro.png') }}">
    <link rel="shortcut icon" type="image/png" href="{{ asset('Proagro.png') }}">
    <link rel="apple-touch-icon" href="{{ asset('Proagro.png') }}">
    <!-- Fonts & Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --sky-50: #f0f9ff;
            --sky-100: #e0f2fe;
            --sky-200: #bae6fd;
            --sky-600: #0284c7;
            --sky-700: #0369a1;
            --blue-700: #1d4ed8;
            --indigo-800: #3730a3;
            --slate-50: #f8fafc;
            --slate-100: #f1f5f9;
            --slate-200: #e2e8f0;
            --slate-300: #cbd5e1;
            --slate-400: #94a3b8;
            --slate-500: #64748b;
            --slate-600: #475569;
            --slate-700: #334155;
            --slate-800: #1e293b;
            --slate-900: #0f172a;
            --emerald-50: #ecfdf5;
            --emerald-100: #d1fae5;
            --emerald-200: #a7f3d0;
            --emerald-600: #059669;
            --emerald-700: #047857;
        }
        * { box-sizing: border-box; }
        html, body {
            width: 100%;
            min-height: 100%;
            margin: 0;
            padding: 0;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background: #f8fafc;
            color: var(--slate-800);
        }
        button, input, select, textarea { font-family: inherit; }
        
        .app-shell { display: flex; min-height: 100vh; background: #f8fafc; }
        .app-sidebar {
            display: none;
            width: 5rem;
            flex-shrink: 0;
            position: sticky;
            top: 0;
            height: 100vh;
            background: rgba(15, 23, 42, 0.95);
            color: #ffffff;
            border-right: 1px solid #1e293b;
            flex-direction: column;
            overflow: hidden;
            z-index: 50;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            backdrop-filter: blur(4px);
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .app-sidebar:hover { width: 16rem; }
        @media (min-width: 768px) { .app-sidebar { display: flex; } }
        .app-sidebar-scroll {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 1.5rem 0;
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }
        .app-brand { padding: 0 1rem; display: flex; flex-direction: column; align-items: center; }
        .app-brand-logo { margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; text-decoration: none; }
        .app-brand-logo img { height: 3rem; width: auto; object-fit: contain; }
        .app-brand-text { text-align: center; transition: all 0.3s ease-in-out; white-space: nowrap; display: none; opacity: 0; }
        .app-sidebar:hover .app-brand-text { display: block; opacity: 1; }
        .app-brand-text h2 { margin: 0; font-size: 1.125rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #fff; }
        .app-brand-text p { margin: 0.25rem 0 0; font-size: 0.75rem; font-weight: 500; color: #94a3b8; }
        .app-nav { padding: 0 0.75rem; display: flex; flex-direction: column; gap: 4px; }
        .app-nav-link {
            display: flex;
            align-items: center;
            border-radius: 0.75rem;
            padding: 0.75rem;
            font-size: 0.875rem;
            font-weight: 700;
            color: #94a3b8;
            text-decoration: none;
            position: relative;
            overflow: hidden;
            white-space: nowrap;
            transition: all 0.2s ease;
        }
        .app-nav-link:hover { background: rgba(30, 41, 59, 0.5); color: #fff; }
        .app-nav-link.active { background: #1e293b; color: #fff; }
        .app-nav-link .active-indicator { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background-color: #6366f1; border-radius: 0 4px 4px 0; }
        .app-nav-link .nav-icon { margin-right: 0.75rem; height: 1.5rem; width: 1.5rem; min-width: 24px; color: #64748b; flex-shrink: 0; }
        .app-nav-link span { display: none; opacity: 0; white-space: nowrap; }
        .app-sidebar:hover .app-nav-link span { display: inline; opacity: 1; }
        .text-indigo-400 { color: #818cf8 !important; }
        .text-blue-400 { color: #60a5fa !important; }
        .text-orange-400 { color: #fb923c !important; }
        .text-red-400 { color: #f87171 !important; }
        .text-amber-400 { color: #fbbf24 !important; }
        .text-teal-400 { color: #2dd4bf !important; }
        .text-cyan-400 { color: #22d3ee !important; }
        .text-purple-400 { color: #c084fc !important; }
        .text-green-400 { color: #4ade80 !important; }
        .app-sidebar-footer { padding: 1rem; background: rgba(15, 23, 42, 0.5); border-top: 1px solid rgba(30, 41, 59, 0.5); flex-shrink: 0; }
        .app-user-card { border-radius: 0.75rem; background: rgba(30, 41, 59, 0.5); padding: 0.5rem; border: 1px solid rgba(51, 65, 85, 0.5); display: flex; align-items: center; justify-content: center; }
        .app-sidebar:hover .app-user-card { justify-content: flex-start; }
        .app-user-inner { display: flex; align-items: center; gap: 0.75rem; width: 100%; }
        .app-avatar { height: 2.25rem; width: 2.25rem; min-width: 36px; border-radius: 9999px; background: linear-gradient(135deg, #ec4899, #fb923c); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.875rem; }
        .app-user-meta { display: none; opacity: 0; overflow: hidden; white-space: nowrap; }
        .app-sidebar:hover .app-user-meta { display: block; opacity: 1; }
        .app-user-name { font-size: 0.875rem; font-weight: 700; color: #fff; margin: 0; }
        .app-user-role { font-size: 10px; color: #94a3b8; margin: 2px 0 0; }

        .app-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .app-header {
            position: sticky; top: 0; z-index: 40; height: 64px;
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 24px; background: rgba(255,255,255,.9); border-bottom: 1px solid #e2e8f0;
            backdrop-filter: blur(8px);
        }
        .app-header h1 { margin: 0; font-size: 18px; font-weight: 700; color: #0f172a; }
        .app-header-user { display: flex; align-items: center; gap: 12px; }
        .app-header-user span { font-size: 14px; font-weight: 600; color: #334155; }
        .app-header-avatar {
            width: 32px; height: 32px; border-radius: 999px; background: #e0e7ff;
            color: #4338ca; display: flex; align-items: center; justify-content: center; font-weight: 700;
        }
        .logout-btn { border: 0; background: transparent; color: #94a3b8; padding: 8px; cursor: pointer; }
        .logout-btn:hover { color: #dc2626; }

        .page-container {
            width: 100%;
            max-width: 80rem;
            margin: 0 auto;
            padding: 1.5rem 1rem 3rem;
        }
        @media (min-width: 640px) { .page-container { padding: 2rem 1.5rem 3rem; } }

        .btn-nav {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: var(--slate-700);
            background: #fff;
            padding: 9px 18px;
            border-radius: 12px;
            border: 1px solid var(--slate-200);
            font-size: 13.5px;
            font-weight: 700;
            text-decoration: none;
            box-shadow: 0 1px 3px rgba(0, 0, 0, .05);
            transition: all .2s;
        }
        .btn-nav:hover {
            color: var(--sky-700);
            border-color: var(--sky-200);
            background: var(--sky-50);
            transform: translateY(-1px);
        }

        .btn-primary {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #fff;
            background: var(--emerald-600);
            padding: 11px 24px;
            border-radius: 12px;
            border: none;
            font-size: 14px;
            font-weight: 800;
            text-decoration: none;
            box-shadow: 0 4px 14px rgba(5, 150, 105, 0.3);
            transition: all .2s;
            cursor: pointer;
        }
        .btn-primary:hover {
            background: var(--emerald-700);
            transform: translateY(-1px);
            box-shadow: 0 6px 18px rgba(5, 150, 105, 0.4);
        }

        .form-card {
            background: #fff;
            border: 1px solid var(--slate-200);
            border-radius: 1.5rem;
            overflow: hidden;
            box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.15);
        }

        .form-hero {
            background: linear-gradient(110deg, var(--sky-700), var(--blue-700) 55%, var(--indigo-800));
            color: #fff;
            padding: 1.75rem 2rem;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
        }
        .form-hero h2 { margin: 0; font-size: 1.65rem; font-weight: 900; letter-spacing: -0.02em; }
        .form-hero p { margin: 4px 0 0; font-size: 0.875rem; color: var(--sky-100); }

        .form-section {
            padding: 1.75rem 2rem;
            border-bottom: 1px solid var(--slate-100);
        }
        .section-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--sky-700);
            margin: 0 0 1.25rem;
        }

        .form-grid-4 {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1.25rem;
        }
        .form-grid-2 {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.25rem;
        }

        .form-label {
            display: block;
            font-size: 11.5px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--slate-700);
            margin-bottom: 6px;
        }
        .form-control {
            width: 100%;
            border-radius: 10px;
            border: 1px solid var(--slate-300);
            background: #fff;
            padding: 10px 14px;
            font-size: 14px;
            font-weight: 600;
            color: var(--slate-800);
            outline: none;
            transition: all .2s;
        }
        .form-control:focus {
            border-color: var(--sky-600);
            box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
        }

        .personnel-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid var(--slate-200);
        }
        .personnel-table th {
            background: #bbf7d0;
            color: #064e3b;
            padding: 10px 12px;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #86efac;
        }
        .personnel-table td {
            padding: 8px 12px;
            border-bottom: 1px solid var(--slate-100);
            background: #fff;
        }
        .personnel-table tr:hover td { background: #f8fafc; }

        .table-input {
            width: 100%;
            border: 1px solid var(--slate-200);
            border-radius: 8px;
            padding: 6px 10px;
            font-size: 13px;
            font-weight: 600;
            color: var(--slate-800);
            outline: none;
        }
        .table-input:focus { border-color: var(--sky-600); background: #fff; }
        .table-input-center { text-align: center; }

        .btn-small {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 800;
            border: none;
            cursor: pointer;
            transition: all .2s;
        }
        .btn-small-blue { background: var(--sky-50); color: var(--sky-700); border: 1px solid var(--sky-200); }
        .btn-small-blue:hover { background: var(--sky-100); }
        .btn-small-red { background: transparent; color: var(--slate-400); }
        .btn-small-red:hover { color: #dc2626; }

        .leader-card {
            background: #fff;
            border: 1px solid var(--slate-200);
            border-radius: 1rem;
            padding: 1.25rem;
        }
        .leader-header {
            display: inline-block;
            background: var(--emerald-100);
            color: var(--emerald-800);
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            padding: 4px 10px;
            border-radius: 6px;
            margin-bottom: 12px;
        }

        .modal-backdrop {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 100;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(4px);
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        .modal-content {
            background: #fff;
            border-radius: 1.25rem;
            width: 100%;
            max-width: 440px;
            padding: 1.75rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }
    </style>
</head>
<body>
@php
    $authUser = auth()->user();
    $tenant = config('app.tenant');
    $rawLogo = is_object($tenant) ? ($tenant->logo ?? 'images/logovecode.png') : (data_get($tenant, 'logo') ?: 'images/logovecode.png');
    $tenantLogo = str_starts_with((string)$rawLogo, 'http') ? $rawLogo : asset(ltrim((string)$rawLogo, '/'));
    $tenantName = is_object($tenant) ? ($tenant->name ?? 'Vecode') : (data_get($tenant, 'name') ?: 'Vecode');
    $tenantSlug = is_object($tenant) ? ($tenant->slug ?? '') : (data_get($tenant, 'slug') ?: '');
    $brandTitle = $tenantSlug === 'proagro' ? 'Vecode' : (explode(' ', $tenantName)[0] ?? 'Vecode');
    $brandSubtitle = $tenantSlug === 'proagro' ? 'Logística Pro-Agroindustria' : $tenantName;
    $userName = $authUser->name ?? 'Usuario';
    $userRole = method_exists($authUser, 'getRoleNames') ? ($authUser->getRoleNames()->first() ?: 'Operador') : 'Operador';
    
    $personnel = is_array($attendance->personnel) ? $attendance->personnel : json_decode($attendance->personnel, true);
    if (!is_array($personnel)) { $personnel = []; }
    
    $squadLeader = is_array($attendance->squad_leader) ? $attendance->squad_leader : json_decode($attendance->squad_leader, true);
    $leader = is_array($squadLeader) && isset($squadLeader[0]) ? $squadLeader[0] : ['name' => '', 'entry_time' => '07:00', 'exit_time' => '19:00'];
    
    $safetySupervisor = is_array($attendance->safety_supervisor) ? $attendance->safety_supervisor : json_decode($attendance->safety_supervisor, true);
    $safety = is_array($safetySupervisor) && isset($safetySupervisor[0]) ? $safetySupervisor[0] : ['name' => '', 'entry_time' => '07:00', 'exit_time' => '19:00'];
@endphp

<div class="app-shell">
    <aside class="app-sidebar sidebar-container">
        <div class="app-sidebar-scroll">
            <div class="app-brand">
                <a href="{{ route('dashboard') }}" class="app-brand-logo">
                    <img src="{{ $tenantLogo }}" alt="{{ $tenantName }}" onerror="this.src='{{ asset('images/logovecode.png') }}'">
                </a>
                <div class="app-brand-text">
                    <h2>{{ $brandTitle }}</h2>
                    <p>{{ $brandSubtitle }}</p>
                </div>
            </div>
            <nav class="app-nav">
                <a href="{{ route('dashboard') }}" class="app-nav-link" title="Inicio">
                    <svg class="nav-icon text-indigo-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                    <span>Inicio</span>
                </a>
                @can('view commercialization')
                <a href="{{ route('sales.index') }}" class="app-nav-link" title="Comercialización">
                    <svg class="nav-icon text-blue-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
                    <span>Comercialización</span>
                </a>
                @endcan
                @if($authUser?->hasRole('Admin') || $authUser?->can('view traffic'))
                <a href="{{ route('traffic.index') }}" class="app-nav-link" title="Tráfico">
                    <svg class="nav-icon text-orange-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18.5" r="2.5"/><circle cx="7" cy="18.5" r="2.5"/></svg>
                    <span>Tráfico</span>
                </a>
                @endif
                @can('view surveillance')
                <a href="{{ route('surveillance.index') }}" class="app-nav-link" title="Vigilancia">
                    <svg class="nav-icon text-red-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    <span>Vigilancia</span>
                </a>
                @endcan
                @can('view documentation')
                <a href="{{ route('documentation.index') }}" class="app-nav-link" title="Documentación">
                    <svg class="nav-icon text-amber-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                    <span>Documentación</span>
                </a>
                @endcan
                @can('view scale')
                <a href="{{ route('scale.index') }}" class="app-nav-link" title="Báscula">
                    <svg class="nav-icon text-teal-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
                    <span>Báscula</span>
                </a>
                @endcan
                @can('view dock')
                <a href="{{ route('dock.index') }}" class="app-nav-link" title="Muelle">
                    <svg class="nav-icon text-cyan-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4"/><path d="M12 2v3"/></svg>
                    <span>Muelle</span>
                </a>
                @endcan
                @can('view apt')
                <a href="{{ route('apt.index') }}" class="app-nav-link active" title="APT">
                    <div class="active-indicator"></div>
                    <svg class="nav-icon text-purple-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                    <span>APT</span>
                </a>
                @endcan
                @if($authUser?->hasRole('Admin'))
                <a href="{{ route('admin.users.index') }}" class="app-nav-link" title="Administración">
                    <svg class="nav-icon text-green-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span>Administración</span>
                </a>
                @endif
            </nav>
        </div>
        <div class="app-sidebar-footer">
            <div class="app-user-card">
                <div class="app-user-inner">
                    <div class="app-avatar">{{ mb_substr($userName, 0, 1) }}</div>
                    <div class="app-user-meta">
                        <p class="app-user-name">{{ $userName }}</p>
                        <p class="app-user-role">{{ $userRole }} • <span class="online">ONLINE</span></p>
                    </div>
                </div>
            </div>
        </div>
    </aside>

    <div class="app-main">
        <header class="app-header">
            <h1>Gestión de Prestadores de Servicios</h1>
            <div class="app-header-user">
                <span>{{ $userName }}</span>
                <div class="app-header-avatar">{{ mb_substr($userName, 0, 1) }}</div>
                <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <button type="submit" class="logout-btn" title="Cerrar sesión">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                    </button>
                </form>
            </div>
        </header>

        <main class="page-container">
            <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px;">
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <a href="{{ route('apt.attendance.index') }}" class="btn-nav">
                        <i class="fa-solid fa-arrow-left"></i> Volver al Listado
                    </a>
                    <a href="{{ route('apt.attendance.print', $attendance->id) }}" class="btn-nav">
                        <i class="fa-solid fa-print"></i> Ver Documento Imprimible
                    </a>
                </div>
                <div>
                    <span style="display: inline-block; background: var(--sky-50); color: var(--sky-700); border: 1px solid var(--sky-200); padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 900; text-transform: uppercase;">
                        Folio: {{ $attendance->folio ?: 'S/F' }}
                    </span>
                </div>
            </div>

            <form method="POST" action="{{ route('apt.attendance.update', $attendance->id) }}" class="form-card" id="attendanceForm">
                @csrf
                @method('PUT')
                <input type="hidden" name="format_code" value="{{ $attendance->format_code ?: 'GLS-AP-FO-005' }}">
                <input type="hidden" name="supervision_name" value="{{ $attendance->supervision_name ?: 'PRO-AGROINDUSTRIA, S.A. DE C.V.' }}">

                <!-- Header -->
                <div class="form-hero">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <img src="{{ asset('Proagro.png') }}" alt="Logo" style="width: 52px; height: 52px; object-fit: contain; background: #fff; border-radius: 12px; padding: 4px;">
                        <div>
                            <span style="font-size: 11px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 999px;">
                                Modificación · Formato {{ $attendance->format_code ?: 'GLS-AP-FO-005' }}
                            </span>
                            <h2>Editar Control de Asistencias</h2>
                            <p>{{ $attendance->service_provider }}</p>
                        </div>
                    </div>
                    <div>
                        <button type="submit" class="btn-primary">
                            <i class="fa-solid fa-floppy-disk"></i> Guardar Cambios e Imprimir
                        </button>
                    </div>
                </div>

                <!-- Section 1: Datos Generales -->
                <div class="form-section">
                    <h3 class="section-title">
                        <i class="fa-solid fa-building"></i> 1. Datos Generales del Servicio y Turno
                    </h3>
                    <div class="form-grid-4">
                        <div style="grid-column: span 2;">
                            <label class="form-label">Prestador de Servicios *</label>
                            <input type="text" name="service_provider" value="{{ old('service_provider', $attendance->service_provider) }}" required class="form-control">
                        </div>

                        <div>
                            <label class="form-label">Turno *</label>
                            <select name="shift" required class="form-control">
                                @foreach(['1A', '1B', 'Turno 1', 'Turno 2', 'Turno 3', '2A', '2B', '3A', '3B'] as $shift)
                                    <option value="{{ $shift }}" @selected(old('shift', $attendance->shift) === $shift)>{{ $shift }}</option>
                                @endforeach
                            </select>
                        </div>

                        <div>
                            <label class="form-label">Área de Trabajo *</label>
                            <select name="work_area" required class="form-control">
                                @foreach(['APT 2', 'APT 1', 'APT 3', 'APT 4', 'APT 5', 'Muelle APT', 'Área de Envasado'] as $area)
                                    <option value="{{ $area }}" @selected(old('work_area', $attendance->work_area) === $area)>{{ $area }}</option>
                                @endforeach
                            </select>
                        </div>

                        <div>
                            <label class="form-label">Fecha de Registro *</label>
                            <input type="date" name="date" value="{{ old('date', \Carbon\Carbon::parse($attendance->date)->format('Y-m-d')) }}" required class="form-control">
                        </div>

                        <div style="grid-column: span 2;">
                            <label class="form-label">Actividad que se va a Realizar *</label>
                            <input type="text" name="activity" value="{{ old('activity', $attendance->activity) }}" required class="form-control">
                        </div>

                        <div>
                            <label class="form-label">Línea de Carga</label>
                            <input type="text" name="loading_line" value="{{ old('loading_line', $attendance->loading_line) }}" class="form-control">
                        </div>
                    </div>
                </div>

                <!-- Section 2: Personal -->
                <div class="form-section">
                    <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 1rem;">
                        <h3 class="section-title" style="margin: 0;">
                            <i class="fa-solid fa-users"></i> 2. Personal que Realiza la Actividad ({{ count($personnel) }} Registrados)
                        </h3>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" class="btn-small btn-small-blue" onclick="openBulkModal()">
                                <i class="fa-solid fa-clock"></i> Copiar Horarios a Todos
                            </button>
                            <button type="button" class="btn-small btn-small-blue" onclick="addPersonnelRow()">
                                <i class="fa-solid fa-plus"></i> Agregar Fila
                            </button>
                        </div>
                    </div>

                    <div style="overflow-x: auto;">
                        <table class="personnel-table" id="personnelTable">
                            <thead>
                                <tr>
                                    <th style="width: 60px; text-align: center;">Num.</th>
                                    <th>Nombre Completo del Trabajador</th>
                                    <th style="width: 140px; text-align: center;">Firma / Estado</th>
                                    <th style="width: 110px; text-align: center;">H.E (Entrada)</th>
                                    <th style="width: 110px; text-align: center;">H.S (Salida)</th>
                                    <th style="width: 45px;"></th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($personnel as $idx => $row)
                                    @php $num = $row['num'] ?? str_pad($idx + 1, 2, '0', STR_PAD_LEFT); @endphp
                                    <tr id="row-{{ $idx + 1 }}">
                                        <td style="text-align: center;">
                                            <input type="text" name="personnel[{{ $idx }}][num]" value="{{ $num }}" class="table-input table-input-center" style="font-weight: 800; color: var(--slate-600);">
                                        </td>
                                        <td>
                                            <input type="text" name="personnel[{{ $idx }}][name]" value="{{ $row['name'] ?? '' }}" placeholder="Nombre trabajador #{{ $num }}" class="table-input" style="text-transform: uppercase;">
                                        </td>
                                        <td>
                                            <input type="text" name="personnel[{{ $idx }}][signature]" value="{{ $row['signature'] ?? '' }}" placeholder="Firma física" class="table-input table-input-center">
                                        </td>
                                        <td>
                                            <input type="text" name="personnel[{{ $idx }}][entry_time]" value="{{ $row['entry_time'] ?? '07:00' }}" class="table-input table-input-center entry-time-input" style="font-weight: 700;">
                                        </td>
                                        <td>
                                            <input type="text" name="personnel[{{ $idx }}][exit_time]" value="{{ $row['exit_time'] ?? '19:00' }}" class="table-input table-input-center exit-time-input" style="font-weight: 700;">
                                        </td>
                                        <td style="text-align: center;">
                                            <button type="button" class="btn-small-red" onclick="removePersonnelRow(this)" title="Eliminar fila">
                                                <i class="fa-solid fa-trash-can"></i>
                                            </button>
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Section 3: Responsables -->
                <div class="form-section">
                    <h3 class="section-title">
                        <i class="fa-solid fa-user-shield"></i> 3. Responsables y Supervisión del Turno
                    </h3>
                    <div class="form-grid-2">
                        <!-- Líder de Cuadrilla -->
                        <div class="leader-card">
                            <div style="margin-bottom: 8px;">
                                <span class="leader-header">Líder de Cuadrilla Responsable</span>
                            </div>
                            <input type="hidden" name="squad_leader[0][num]" value="01">
                            <div style="margin-bottom: 10px;">
                                <label class="form-label">Nombre Completo del Líder</label>
                                <input type="text" name="squad_leader[0][name]" id="leaderName" value="{{ $leader['name'] ?? '' }}" class="form-control" style="text-transform: uppercase;">
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div>
                                    <label class="form-label">H.E (Entrada)</label>
                                    <input type="text" name="squad_leader[0][entry_time]" id="leaderEntry" value="{{ $leader['entry_time'] ?? '07:00' }}" class="form-control" style="text-align: center; font-weight: 700;">
                                </div>
                                <div>
                                    <label class="form-label">H.S (Salida)</label>
                                    <input type="text" name="squad_leader[0][exit_time]" id="leaderExit" value="{{ $leader['exit_time'] ?? '19:00' }}" class="form-control" style="text-align: center; font-weight: 700;">
                                </div>
                            </div>
                        </div>

                        <!-- Supervisor de Seguridad -->
                        <div class="leader-card">
                            <div style="margin-bottom: 8px;">
                                <span class="leader-header">Supervisor de Seguridad del Prestador</span>
                            </div>
                            <input type="hidden" name="safety_supervisor[0][num]" value="01">
                            <div style="margin-bottom: 10px;">
                                <label class="form-label">Nombre Completo del Supervisor</label>
                                <input type="text" name="safety_supervisor[0][name]" value="{{ $safety['name'] ?? '' }}" class="form-control" style="text-transform: uppercase;">
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div>
                                    <label class="form-label">H.E (Entrada)</label>
                                    <input type="text" name="safety_supervisor[0][entry_time]" value="{{ $safety['entry_time'] ?? '07:00' }}" class="form-control" style="text-align: center; font-weight: 700;">
                                </div>
                                <div>
                                    <label class="form-label">H.S (Salida)</label>
                                    <input type="text" name="safety_supervisor[0][exit_time]" value="{{ $safety['exit_time'] ?? '19:00' }}" class="form-control" style="text-align: center; font-weight: 700;">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section 4: Observaciones y Envío -->
                <div class="form-section">
                    <label class="form-label">Observaciones Adicionales</label>
                    <textarea name="observations" rows="3" class="form-control">{{ old('observations', $attendance->observations) }}</textarea>

                    <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--slate-200);">
                        <div style="font-size: 13px; color: var(--slate-500); font-weight: 600;">
                            Supervisión: <strong style="color: var(--slate-800);">{{ $attendance->supervision_name ?: 'PRO-AGROINDUSTRIA, S.A. DE C.V.' }}</strong>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <a href="{{ route('apt.attendance.print', $attendance->id) }}" class="btn-nav">
                                Cancelar
                            </a>
                            <button type="submit" class="btn-primary">
                                <i class="fa-solid fa-floppy-disk"></i> Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </main>
    </div>
</div>

<!-- Bulk Modal -->
<div class="modal-backdrop" id="bulkModal">
    <div class="modal-content">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; color: var(--sky-700);">
            <i class="fa-solid fa-clock" style="font-size: 20px;"></i>
            <h3 style="margin: 0; font-size: 16px; font-weight: 900;">Copiar Horarios a Todo el Personal</h3>
        </div>
        <p style="font-size: 13px; color: var(--slate-600); margin: 0 0 16px;">
            Aplica automáticamente la hora de entrada y salida a todos los trabajadores de la lista.
        </p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
            <div>
                <label class="form-label">Hora Entrada (H.E)</label>
                <input type="text" id="bulkEntryInput" value="07:00" class="form-control" style="text-align: center; font-weight: 700;">
            </div>
            <div>
                <label class="form-label">Hora Salida (H.S)</label>
                <input type="text" id="bulkExitInput" value="19:00" class="form-control" style="text-align: center; font-weight: 700;">
            </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button type="button" class="btn-nav" onclick="closeBulkModal()">Cancelar</button>
            <button type="button" class="btn-primary" onclick="applyBulkSchedule()">Aplicar a Todos</button>
        </div>
    </div>
</div>

<script>
    let personnelCount = {{ count($personnel) }};

    function addPersonnelRow() {
        personnelCount++;
        const numStr = String(personnelCount).padStart(2, '0');
        const tbody = document.querySelector('#personnelTable tbody');
        const tr = document.createElement('tr');
        tr.id = `row-${personnelCount}`;
        tr.innerHTML = `
            <td style="text-align: center;">
                <input type="text" name="personnel[${personnelCount - 1}][num]" value="${numStr}" class="table-input table-input-center" style="font-weight: 800; color: var(--slate-600);">
            </td>
            <td>
                <input type="text" name="personnel[${personnelCount - 1}][name]" value="" placeholder="Nombre trabajador #${numStr}" class="table-input" style="text-transform: uppercase;">
            </td>
            <td>
                <input type="text" name="personnel[${personnelCount - 1}][signature]" value="" placeholder="Firma física" class="table-input table-input-center">
            </td>
            <td>
                <input type="text" name="personnel[${personnelCount - 1}][entry_time]" value="07:00" class="table-input table-input-center entry-time-input" style="font-weight: 700;">
            </td>
            <td>
                <input type="text" name="personnel[${personnelCount - 1}][exit_time]" value="19:00" class="table-input table-input-center exit-time-input" style="font-weight: 700;">
            </td>
            <td style="text-align: center;">
                <button type="button" class="btn-small-red" onclick="removePersonnelRow(this)" title="Eliminar fila">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    }

    function removePersonnelRow(btn) {
        const tr = btn.closest('tr');
        if (document.querySelectorAll('#personnelTable tbody tr').length > 1) {
            tr.remove();
        }
    }

    function openBulkModal() {
        document.getElementById('bulkModal').style.display = 'flex';
    }

    function closeBulkModal() {
        document.getElementById('bulkModal').style.display = 'none';
    }

    function applyBulkSchedule() {
        const entry = document.getElementById('bulkEntryInput').value;
        const exit = document.getElementById('bulkExitInput').value;
        document.querySelectorAll('.entry-time-input').forEach(input => input.value = entry);
        document.querySelectorAll('.exit-time-input').forEach(input => input.value = exit);
        closeBulkModal();
    }
</script>
</body>
</html>
