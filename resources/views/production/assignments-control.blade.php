<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Control de Asignaciones - Gestión de la Producción</title>
    <link rel="icon" type="image/png" href="{{ asset('Proagro.png') }}">
    <link rel="shortcut icon" type="image/png" href="{{ asset('Proagro.png') }}">
    <link rel="apple-touch-icon" href="{{ asset('Proagro.png') }}">
    <!-- Fonts & Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
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
            --rose-50: #fff1f2;
            --rose-100: #ffe4e6;
            --rose-200: #fecdd3;
            --rose-600: #e11d48;
            --rose-700: #be123c;
        }
        * { box-sizing: border-box; }
        html, body {
            width: 100%;
            min-height: 100%;
            margin: 0;
            padding: 0;
            font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            color: var(--slate-800);
        }
        button, input, select, textarea {
            font-family: inherit;
        }
        .app-shell {
            display: flex;
            min-height: 100vh;
            background: #f8fafc;
        }
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
        .app-sidebar:hover {
            width: 16rem;
        }
        @media (min-width: 768px) {
            .app-sidebar {
                display: flex;
            }
        }
        .app-sidebar-scroll {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 1.5rem 0;
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }
        .app-sidebar-scroll::-webkit-scrollbar { width: 6px; }
        .app-sidebar-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 9999px; }
        .app-brand {
            padding: 0 1rem;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .app-brand-logo {
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
            text-decoration: none;
        }
        .app-brand-logo:hover { transform: scale(1.05); }
        .app-brand-logo img {
            height: 3rem;
            width: auto;
            object-fit: contain;
            filter: drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15));
        }
        .app-brand-text {
            text-align: center;
            transition: all 0.3s ease-in-out;
            white-space: nowrap;
            display: none;
            opacity: 0;
        }
        .app-sidebar:hover .app-brand-text { display: block; opacity: 1; }
        .app-brand-text h2 {
            margin: 0;
            font-size: 1.125rem;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #ffffff;
        }
        .app-brand-text p {
            margin: 0.25rem 0 0;
            font-size: 0.75rem;
            font-weight: 500;
            color: #94a3b8;
        }
        .app-nav {
            padding: 0 0.75rem;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
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
        .app-nav-link:hover { background: rgba(30, 41, 59, 0.5); color: #ffffff; }
        .app-nav-link.active { background: #1e293b; color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2); }
        .app-nav-link .active-indicator {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background-color: #6366f1;
            border-top-right-radius: 9999px;
            border-bottom-right-radius: 9999px;
        }
        .app-nav-link .nav-icon {
            margin-right: 0.75rem;
            height: 1.5rem;
            width: 1.5rem;
            min-width: 24px;
            color: #64748b;
            flex-shrink: 0;
        }
        .app-nav-link:hover .nav-icon { color: #e4e4e7; }
        .text-indigo-400 { color: #818cf8 !important; }
        .text-blue-400 { color: #60a5fa !important; }
        .text-orange-400 { color: #fb923c !important; }
        .text-red-400 { color: #f87171 !important; }
        .text-amber-400 { color: #fbbf24 !important; }
        .text-teal-400 { color: #2dd4bf !important; }
        .text-cyan-400 { color: #22d3ee !important; }
        .text-purple-400 { color: #c084fc !important; }
        .text-green-400 { color: #4ade80 !important; }

        .app-nav-link span {
            letter-spacing: 0.025em;
            transition: all 0.3s ease-in-out;
            display: none;
            opacity: 0;
            white-space: nowrap;
        }
        .app-sidebar:hover .app-nav-link span { display: inline; opacity: 1; }
        .app-sidebar-footer {
            padding: 1rem;
            background: rgba(15, 23, 42, 0.5);
            backdrop-filter: blur(4px);
            border-top: 1px solid rgba(30, 41, 59, 0.5);
            flex-shrink: 0;
        }
        .app-user-card {
            border-radius: 0.75rem;
            background: rgba(30, 41, 59, 0.5);
            padding: 0.5rem;
            border: 1px solid rgba(51, 65, 85, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .app-sidebar:hover .app-user-card { justify-content: flex-start; }
        .app-user-inner { display: flex; align-items: center; gap: 0.75rem; width: 100%; }
        .app-avatar {
            height: 2.25rem;
            width: 2.25rem;
            min-width: 36px;
            border-radius: 9999px;
            background: linear-gradient(135deg, #ec4899, #fb923c);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 700;
            font-size: 0.875rem;
            margin: 0 auto;
        }
        .app-sidebar:hover .app-avatar { margin: 0; }
        .app-user-meta {
            overflow: hidden;
            white-space: nowrap;
            display: none;
            opacity: 0;
        }
        .app-sidebar:hover .app-user-meta { display: block; opacity: 1; }
        .app-user-name {
            font-size: 0.875rem;
            font-weight: 700;
            color: #ffffff;
            margin: 0;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .app-user-role {
            font-size: 10px;
            color: #94a3b8;
            text-transform: uppercase;
            margin: 2px 0 0;
        }

        .app-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .app-header {
            position: sticky; top: 0; z-index: 40; height: 64px;
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 24px; background: rgba(255,255,255,.85); border-bottom: 1px solid #e2e8f0;
            backdrop-filter: blur(8px);
        }
        .app-header h1 { margin: 0; font-size: 18px; font-weight: 700; color: #0f172a; }
        .app-header-user { display: flex; align-items: center; gap: 12px; }
        .app-header-user span { font-size: 14px; font-weight: 600; color: #334155; }
        .app-header-avatar {
            width: 32px; height: 32px; border-radius: 999px; background: #e0e7ff;
            color: #4338ca; display: flex; align-items: center; justify-content: center; font-weight: 700;
        }
        .app-header-user button, .app-header-user .logout-btn {
            border: 0; background: transparent; color: #94a3b8; padding: 8px; cursor: pointer;
            display: inline-flex; align-items: center; justify-content: center;
        }
        .app-header-user .logout-btn:hover { color: #dc2626; }

        .page {
            width: 100%;
            max-width: 80rem;
            margin: 0 auto;
            padding: 1.75rem 1.25rem 3.5rem;
        }
        @media (min-width: 640px) { .page { padding-left: 2rem; padding-right: 2rem; } }

        .nav-row {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
        }
        .back-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: var(--slate-700);
            background: #fff;
            padding: 9px 18px;
            border-radius: 12px;
            border: 1px solid var(--slate-200);
            font-size: 14px;
            font-weight: 700;
            text-decoration: none;
            box-shadow: 0 1px 3px rgba(0, 0, 0, .05);
            transition: all .2s;
        }
        .back-btn:hover {
            color: var(--sky-700);
            border-color: var(--sky-200);
            background: var(--sky-50);
            transform: translateY(-1px);
        }

        .hero-banner {
            margin-bottom: 24px;
        }
        .hero-kicker {
            margin: 0 0 6px;
            color: var(--sky-700);
            font-size: 11px;
            font-weight: 900;
            letter-spacing: .18em;
            text-transform: uppercase;
        }
        .hero-banner h1 {
            margin: 0;
            font-size: clamp(24px, 3.5vw, 34px);
            font-weight: 900;
            color: var(--slate-900);
            letter-spacing: -.02em;
        }
        .hero-banner p {
            margin: 6px 0 0;
            color: var(--slate-500);
            font-size: 14px;
            font-weight: 500;
        }

        .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 20px;
        }
        .summary-card {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 18px 20px;
            background: #ffffff;
            border: 1px solid var(--slate-200);
            border-radius: 16px;
            box-shadow: 0 4px 15px -3px rgba(15, 23, 42, .04);
            transition: transform .15s ease, box-shadow .15s ease;
        }
        .summary-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px -4px rgba(15, 23, 42, .08);
        }
        .summary-icon {
            display: grid;
            width: 44px;
            height: 44px;
            place-items: center;
            border-radius: 12px;
            background: #eff6ff;
            color: #2563eb;
            font-size: 18px;
            flex-shrink: 0;
        }
        .summary-card:nth-child(3) .summary-icon {
            background: #ecfdf5;
            color: #16a34a;
        }
        .summary-card:nth-child(4) .summary-icon {
            background: #fffbeb;
            color: #d97706;
        }
        .summary-content {
            display: flex;
            flex-direction: column;
        }
        .summary-value {
            display: block;
            font-size: 24px;
            font-weight: 900;
            color: var(--slate-900);
            line-height: 1.1;
        }
        .summary-label {
            margin-top: 3px;
            color: var(--slate-500);
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .06em;
        }
        @media (max-width: 1024px) {
            .summary { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 540px) {
            .summary { grid-template-columns: 1fr; gap: 10px; }
            .summary-card { padding: 14px 16px; }
        }

        .filter-panel {
            display: flex;
            flex-wrap: wrap;
            align-items: flex-end;
            gap: 12px;
            padding: 16px 20px;
            margin-bottom: 20px;
            background: #fff;
            border: 1px solid var(--slate-200);
            border-radius: 16px;
            box-shadow: 0 4px 20px -4px rgba(15, 23, 42, .05);
        }
        .filter-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-width: 220px;
            flex: 1;
        }
        .filter-field label {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: .06em;
            text-transform: uppercase;
            color: var(--slate-600);
        }
        .filter-input {
            width: 100%;
            border: 1px solid var(--slate-300);
            border-radius: 10px;
            padding: 10px 14px;
            color: var(--slate-800);
            font-size: 14px;
            font-weight: 600;
            background: #fff;
            outline: none;
            transition: all .2s;
        }
        .filter-input:focus {
            border-color: var(--sky-600);
            box-shadow: 0 0 0 3px rgba(2, 132, 199, .15);
        }
        .filter-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: none;
            border-radius: 10px;
            padding: 10px 18px;
            background: var(--sky-600);
            color: #fff;
            font-size: 14px;
            font-weight: 800;
            cursor: pointer;
            transition: background .2s;
            height: 42px;
        }
        .filter-btn:hover { background: var(--sky-700); }
        .filter-clear {
            display: inline-flex;
            align-items: center;
            color: var(--slate-500);
            font-size: 13px;
            font-weight: 700;
            text-decoration: none;
            padding: 10px 12px;
            height: 42px;
        }
        .filter-clear:hover { color: var(--rose-600); }

        .table-card {
            overflow: hidden;
            border: 1px solid var(--slate-200);
            border-radius: 18px;
            background: #fff;
            box-shadow: 0 10px 30px -5px rgba(15, 23, 42, .07);
        }
        .table-header-box {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 18px 24px;
            border-bottom: 1px solid var(--slate-100);
            background: #ffffff;
        }
        .table-header-box h2 {
            margin: 0;
            font-size: 16px;
            font-weight: 800;
            color: var(--slate-900);
        }
        .table-header-box span {
            color: var(--slate-500);
            font-size: 12px;
            font-weight: 700;
        }
        .table-responsive {
            overflow-x: auto;
        }
        table {
            width: 100%;
            min-width: 900px;
            border-collapse: collapse;
        }
        th {
            padding: 14px 20px;
            background: var(--slate-50);
            color: var(--slate-500);
            font-size: 11px;
            font-weight: 900;
            letter-spacing: .08em;
            text-align: left;
            text-transform: uppercase;
            border-bottom: 1px solid var(--slate-200);
        }
        td {
            padding: 16px 20px;
            border-top: 1px solid var(--slate-100);
            color: var(--slate-700);
            font-size: 14px;
            vertical-align: middle;
        }
        tr:hover td {
            background: #f8fbff;
        }
        .user-cell {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .user-avatar-small {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--sky-100);
            color: var(--sky-700);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 12px;
            flex-shrink: 0;
        }
        .user-name-text {
            font-weight: 800;
            color: var(--slate-900);
        }
        .lot-select {
            width: 100%;
            max-width: 320px;
            border: 1px solid var(--sky-200);
            border-radius: 10px;
            padding: 9px 12px;
            color: var(--sky-700);
            background: #fff;
            font-size: 13px;
            font-weight: 800;
            outline: none;
            box-shadow: 0 1px 2px rgba(15, 23, 42, .04);
            transition: all .2s;
        }
        .lot-select:focus {
            border-color: var(--sky-600);
            box-shadow: 0 0 0 3px rgba(2, 132, 199, .15);
        }
        .single-lot-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 12px;
            border-radius: 8px;
            background: var(--sky-50);
            border: 1px solid var(--sky-200);
            color: var(--sky-700);
            font-size: 13px;
            font-weight: 800;
        }
        .date-sub {
            display: block;
            margin-top: 3px;
            color: var(--slate-400);
            font-size: 11px;
            font-weight: 600;
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            border-radius: 999px;
            padding: 5px 12px;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .04em;
        }
        .badge.open {
            color: var(--emerald-700);
            background: var(--emerald-100);
            border: 1px solid var(--emerald-200);
        }
        .badge.closed {
            color: var(--rose-700);
            background: var(--rose-100);
            border: 1px solid var(--rose-200);
        }
        .actions-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .action-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            border: 1px solid transparent;
            border-radius: 9px;
            padding: 8px 14px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            transition: all .2s;
        }
        .action-btn.close {
            border-color: var(--rose-200);
            background: var(--rose-50);
            color: var(--rose-700);
        }
        .action-btn.close:hover {
            background: var(--rose-100);
            border-color: var(--rose-300);
        }
        .action-btn.reopen {
            border-color: var(--emerald-200);
            background: var(--emerald-50);
            color: var(--emerald-700);
        }
        .action-btn.reopen:hover {
            background: var(--emerald-100);
            border-color: var(--emerald-300);
        }
        .action-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .empty-cell {
            padding: 50px 20px;
            color: var(--slate-500);
            text-align: center;
            font-weight: 600;
        }

        /* Toast notification */
        .toast-notification {
            position: fixed;
            top: 80px;
            right: 24px;
            z-index: 100;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            width: min(390px, calc(100vw - 32px));
            padding: 14px 16px;
            border-radius: 12px;
            background: #fff;
            box-shadow: 0 15px 35px -5px rgba(15, 23, 42, .18);
            opacity: 0;
            pointer-events: none;
            transform: translateY(-10px);
            transition: opacity .25s ease, transform .25s ease;
            border: 1px solid var(--emerald-200);
            border-left: 4px solid var(--emerald-600);
        }
        .toast-notification.show {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(0);
        }
        .toast-notification.error {
            border-color: var(--rose-200);
            border-left-color: var(--rose-600);
        }
        .toast-icon-wrap {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: var(--emerald-100);
            color: var(--emerald-700);
            font-weight: 900;
            font-size: 13px;
            flex-shrink: 0;
        }
        .toast-notification.error .toast-icon-wrap {
            background: var(--rose-100);
            color: var(--rose-700);
        }
        .toast-title {
            margin: 0 0 2px;
            color: var(--slate-900);
            font-size: 13px;
            font-weight: 800;
        }
        .toast-desc {
            margin: 0;
            color: var(--slate-600);
            font-size: 12px;
            line-height: 1.4;
        }
        .toast-close-btn {
            border: 0;
            background: transparent;
            color: var(--slate-400);
            font-size: 18px;
            cursor: pointer;
            margin-left: auto;
            padding: 0;
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
@endphp

<div class="app-shell">
    <aside class="app-sidebar">
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
                        <p class="app-user-role">{{ $userRole }}</p>
                    </div>
                </div>
            </div>
        </div>
    </aside>

    <div class="app-main">
        <header class="app-header">
            <h1>Gestión de la Producción</h1>
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

        <!-- Toast Feedback -->
        <div class="toast-notification" id="toastBox" role="status" aria-live="polite">
            <span class="toast-icon-wrap" id="toastIcon">✓</span>
            <div>
                <p class="toast-title" id="toastTitle">Operación completada</p>
                <p class="toast-desc" id="toastMessage"></p>
            </div>
            <button type="button" class="toast-close-btn" id="toastCloseBtn" aria-label="Cerrar">×</button>
        </div>

        <main class="page">
            <div class="nav-row">
                <a class="back-btn" href="{{ route('apt.production.hub') }}">
                    <i class="fa-solid fa-arrow-left"></i> Volver a Gestión de la producción
                </a>
            </div>

            <header class="hero-banner">
                <p class="hero-kicker">Módulo operativo · APT</p>
                <h1>Control de Asignaciones</h1>
                <p>Consulta los usuarios y administra el cierre o reapertura de cada lote asignado.</p>
            </header>

            <section class="summary" aria-label="Resumen de asignaciones">
                <div class="summary-card">
                    <div class="summary-icon">
                        <i class="fa-solid fa-users"></i>
                    </div>
                    <div class="summary-content">
                        <span class="summary-value" data-summary-users>{{ $summary['users'] ?? $assignments->count() }}</span>
                        <span class="summary-label">Usuarios</span>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">
                        <i class="fa-solid fa-boxes-stacked"></i>
                    </div>
                    <div class="summary-content">
                        <span class="summary-value" data-summary-total>{{ $summary['total'] ?? 0 }}</span>
                        <span class="summary-label">Asignaciones</span>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">
                        <i class="fa-solid fa-lock-open"></i>
                    </div>
                    <div class="summary-content">
                        <span class="summary-value" data-summary-open>{{ $summary['open'] ?? 0 }}</span>
                        <span class="summary-label">Lotes abiertos</span>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">
                        <i class="fa-solid fa-circle-check"></i>
                    </div>
                    <div class="summary-content">
                        <span class="summary-value" data-summary-closed>{{ $summary['closed'] ?? 0 }}</span>
                        <span class="summary-label">Lotes cerrados</span>
                    </div>
                </div>
            </section>

            <form class="filter-panel" method="GET" action="{{ route('apt.management.assignments.control') }}">
                <div class="filter-field">
                    <label for="filterSearch">Buscar usuario, lote o turno</label>
                    <input type="search" id="filterSearch" name="search" class="filter-input" value="{{ $search }}" placeholder="Ej. Eduardo, PA2026, Turno 2...">
                </div>
                <div class="filter-field" style="max-width: 220px;">
                    <label for="filterStatus">Estado</label>
                    <select id="filterStatus" name="status" class="filter-input">
                        <option value="all" {{ $statusFilter === 'all' ? 'selected' : '' }}>Todos</option>
                        <option value="open" {{ $statusFilter === 'open' ? 'selected' : '' }}>Solo abiertos</option>
                        <option value="closed" {{ $statusFilter === 'closed' ? 'selected' : '' }}>Solo cerrados</option>
                    </select>
                </div>
                <button type="submit" class="filter-btn">
                    <i class="fa-solid fa-filter"></i> Filtrar
                </button>
                @if($search !== '' || $statusFilter !== 'all')
                <a href="{{ route('apt.management.assignments.control') }}" class="filter-clear">
                    <i class="fa-solid fa-xmark"></i> Limpiar
                </a>
                @endif
            </form>

            <section class="table-card">
                <div class="table-header-box">
                    <h2>Usuarios y lotes asignados</h2>
                    <span>{{ $assignments->count() }} {{ $assignments->count() === 1 ? 'usuario registrado' : 'usuarios registrados' }}</span>
                </div>

                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Lote asignado</th>
                                <th>Turno</th>
                                <th>Fecha asignación</th>
                                <th>Status</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                        @forelse($assignments as $assignment)
                            @php
                                $lotsCount = $assignment['lots']->count();
                                $firstLot = $assignment['lots']->first();
                                $firstStatus = strtolower((string) ($firstLot->status ?? 'open'));
                                $firstClosed = ($firstStatus === 'closed');
                                $userInitial = mb_substr($assignment['user_name'] ?? 'U', 0, 1);
                            @endphp
                            <tr data-assignment-row>
                                <td>
                                    <div class="user-cell">
                                        <div class="user-avatar-small">{{ $userInitial }}</div>
                                        <span class="user-name-text">{{ $assignment['user_name'] }}</span>
                                    </div>
                                </td>
                                <td>
                                    @if($lotsCount > 1)
                                        <select class="lot-select" data-lot-select aria-label="Lotes de {{ $assignment['user_name'] }}">
                                            @foreach($assignment['lots'] as $l)
                                                @php
                                                    $isClosed = (strtolower((string) ($l->status ?? 'open')) === 'closed');
                                                    $lotLabel = (string) $l->lot_folio . ($l->warehouse ? ' · ' . $l->warehouse : '') . ($isClosed ? ' (Cerrado)' : ' (Abierto)');
                                                    $startedFormatted = $l->started_at ? \Carbon\Carbon::parse($l->started_at)->format('d/m/Y H:i') : '—';
                                                    $closedFormatted = ($isClosed && $l->closed_at) ? \Carbon\Carbon::parse($l->closed_at)->format('d/m/Y H:i') : '';
                                                @endphp
                                                <option value="{{ $l->production_shift_start_id }}|{{ $l->lot_id }}"
                                                    {{ $loop->first ? 'selected' : '' }}
                                                    data-folio="{{ $l->lot_folio }}"
                                                    data-warehouse="{{ $l->warehouse ?: '' }}"
                                                    data-status="{{ $isClosed ? 'closed' : 'open' }}"
                                                    data-shift="{{ $l->shift ?: '—' }}"
                                                    data-started-at="{{ $startedFormatted }}"
                                                    data-closed-at="{{ $closedFormatted }}"
                                                    data-closed-by="{{ $l->closed_by_name ?: '' }}"
                                                    data-close-url="{{ route('apt.management.activity.lot.close', ['shiftStart' => $l->production_shift_start_id, 'lot' => $l->lot_id]) }}"
                                                    data-reopen-url="{{ route('apt.management.activity.lot.reopen', ['shiftStart' => $l->production_shift_start_id, 'lot' => $l->lot_id]) }}"
                                                >{{ $lotLabel }}</option>
                                            @endforeach
                                        </select>
                                    @elseif($lotsCount === 1)
                                        @php
                                            $startedFormatted = $firstLot->started_at ? \Carbon\Carbon::parse($firstLot->started_at)->format('d/m/Y H:i') : '—';
                                            $closedFormatted = ($firstClosed && $firstLot->closed_at) ? \Carbon\Carbon::parse($firstLot->closed_at)->format('d/m/Y H:i') : '';
                                        @endphp
                                        <div class="single-lot-badge"
                                            data-single-lot
                                            data-folio="{{ $firstLot->lot_folio }}"
                                            data-warehouse="{{ $firstLot->warehouse ?: '' }}"
                                            data-status="{{ $firstClosed ? 'closed' : 'open' }}"
                                            data-shift="{{ $firstLot->shift ?: '—' }}"
                                            data-started-at="{{ $startedFormatted }}"
                                            data-closed-at="{{ $closedFormatted }}"
                                            data-closed-by="{{ $firstLot->closed_by_name ?: '' }}"
                                            data-close-url="{{ route('apt.management.activity.lot.close', ['shiftStart' => $firstLot->production_shift_start_id, 'lot' => $firstLot->lot_id]) }}"
                                            data-reopen-url="{{ route('apt.management.activity.lot.reopen', ['shiftStart' => $firstLot->production_shift_start_id, 'lot' => $firstLot->lot_id]) }}"
                                        >
                                            <i class="fa-solid fa-box-archive"></i>
                                            <span>{{ $firstLot->lot_folio }}{{ $firstLot->warehouse ? ' · ' . $firstLot->warehouse : '' }}</span>
                                        </div>
                                    @else
                                        <span style="color: var(--slate-400);">Sin lotes asignados</span>
                                    @endif
                                </td>
                                <td>
                                    <span data-shift-text>{{ $firstLot ? ($firstLot->shift ?: '—') : '—' }}</span>
                                </td>
                                <td>
                                    <span data-started-text>{{ $firstLot && $firstLot->started_at ? \Carbon\Carbon::parse($firstLot->started_at)->format('d/m/Y H:i') : '—' }}</span>
                                </td>
                                <td>
                                    <span class="badge {{ $firstClosed ? 'closed' : 'open' }}" data-status-badge>
                                        <i class="fa-solid {{ $firstClosed ? 'fa-lock' : 'fa-lock-open' }}"></i>
                                        <span>{{ $firstClosed ? 'Cerrado' : 'Abierto' }}</span>
                                    </span>
                                    <span class="date-sub" data-closed-meta style="{{ $firstClosed && $firstLot->closed_at ? '' : 'display:none;' }}">
                                        @if($firstClosed && $firstLot->closed_at)
                                            Cerrado: {{ \Carbon\Carbon::parse($firstLot->closed_at)->format('d/m/Y H:i') }}
                                            {{ $firstLot->closed_by_name ? ' por ' . $firstLot->closed_by_name : '' }}
                                        @endif
                                    </span>
                                </td>
                                <td>
                                    <div class="actions-group">
                                        <button type="button" class="action-btn close" data-close-btn style="{{ $firstClosed ? 'display:none;' : '' }}">
                                            <i class="fa-solid fa-lock"></i> Cerrar lote
                                        </button>
                                        <button type="button" class="action-btn reopen" data-reopen-btn style="{{ $firstClosed ? '' : 'display:none;' }}">
                                            <i class="fa-solid fa-lock-open"></i> Abrir lote
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="6" class="empty-cell">
                                    <i class="fa-solid fa-folder-open" style="font-size: 28px; margin-bottom: 8px; display: block; color: var(--slate-300);"></i>
                                    No hay asignaciones de lotes que coincidan con la búsqueda.
                                </td>
                            </tr>
                        @endforelse
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';
    const toastBox = document.getElementById('toastBox');
    const toastIcon = document.getElementById('toastIcon');
    const toastTitle = document.getElementById('toastTitle');
    const toastMsg = document.getElementById('toastMessage');
    const toastCloseBtn = document.getElementById('toastCloseBtn');
    let toastTimeout = null;

    const showToast = (message, type = 'success') => {
        if (!toastBox) return;
        clearTimeout(toastTimeout);
        toastBox.className = `toast-notification show ${type === 'error' ? 'error' : ''}`;
        toastIcon.textContent = type === 'error' ? '!' : '✓';
        toastTitle.textContent = type === 'error' ? 'No se pudo completar la acción' : 'Estado actualizado';
        toastMsg.textContent = message;
        toastTimeout = setTimeout(() => {
            toastBox.classList.remove('show');
        }, 4500);
    };

    toastCloseBtn?.addEventListener('click', () => {
        toastBox?.classList.remove('show');
    });

    document.querySelectorAll('[data-assignment-row]').forEach((row) => {
        const select = row.querySelector('[data-lot-select]');
        const singleLot = row.querySelector('[data-single-lot]');
        const shiftText = row.querySelector('[data-shift-text]');
        const startedText = row.querySelector('[data-started-text]');
        const statusBadge = row.querySelector('[data-status-badge]');
        const closedMeta = row.querySelector('[data-closed-meta]');
        const closeBtn = row.querySelector('[data-close-btn]');
        const reopenBtn = row.querySelector('[data-reopen-btn]');

        const getActiveData = () => {
            if (select && select.selectedIndex >= 0) {
                const opt = select.options[select.selectedIndex];
                return {
                    element: opt,
                    isSelect: true,
                    status: opt.dataset.status || 'open',
                    shift: opt.dataset.shift || '—',
                    startedAt: opt.dataset.startedAt || '—',
                    closedAt: opt.dataset.closedAt || '',
                    closedBy: opt.dataset.closedBy || '',
                    folio: opt.dataset.folio || '',
                    warehouse: opt.dataset.warehouse || '',
                    closeUrl: opt.dataset.closeUrl || '',
                    reopenUrl: opt.dataset.reopenUrl || ''
                };
            } else if (singleLot) {
                return {
                    element: singleLot,
                    isSelect: false,
                    status: singleLot.dataset.status || 'open',
                    shift: singleLot.dataset.shift || '—',
                    startedAt: singleLot.dataset.startedAt || '—',
                    closedAt: singleLot.dataset.closedAt || '',
                    closedBy: singleLot.dataset.closedBy || '',
                    folio: singleLot.dataset.folio || '',
                    warehouse: singleLot.dataset.warehouse || '',
                    closeUrl: singleLot.dataset.closeUrl || '',
                    reopenUrl: singleLot.dataset.reopenUrl || ''
                };
            }
            return null;
        };

        const updateRowView = () => {
            const active = getActiveData();
            if (!active) return;

            const isClosed = (active.status === 'closed');

            if (shiftText) shiftText.textContent = active.shift || '—';
            if (startedText) startedText.textContent = active.startedAt || '—';

            if (statusBadge) {
                statusBadge.className = `badge ${isClosed ? 'closed' : 'open'}`;
                statusBadge.innerHTML = `<i class="fa-solid ${isClosed ? 'fa-lock' : 'fa-lock-open'}"></i> <span>${isClosed ? 'Cerrado' : 'Abierto'}</span>`;
            }

            if (closedMeta) {
                if (isClosed && active.closedAt) {
                    closedMeta.style.display = 'block';
                    closedMeta.textContent = `Cerrado: ${active.closedAt}${active.closedBy ? ' por ' + active.closedBy : ''}`;
                } else {
                    closedMeta.style.display = 'none';
                    closedMeta.textContent = '';
                }
            }

            if (closeBtn && reopenBtn) {
                closeBtn.style.display = isClosed ? 'none' : 'inline-flex';
                reopenBtn.style.display = isClosed ? 'inline-flex' : 'none';
                closeBtn.disabled = false;
                reopenBtn.disabled = false;
                closeBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Cerrar lote';
                reopenBtn.innerHTML = '<i class="fa-solid fa-lock-open"></i> Abrir lote';
            }
        };

        const handleStatusChange = async (action) => {
            const active = getActiveData();
            if (!active) return;

            const targetUrl = action === 'close' ? active.closeUrl : active.reopenUrl;
            if (!targetUrl) {
                showToast('No se encontró la ruta de actualización para este lote.', 'error');
                return;
            }

            if (closeBtn) closeBtn.disabled = true;
            if (reopenBtn) reopenBtn.disabled = true;

            const targetBtn = action === 'close' ? closeBtn : reopenBtn;
            if (targetBtn) {
                targetBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Actualizando...';
            }

            try {
                const response = await fetch(targetUrl, {
                    method: 'PATCH',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data.message || `Error ${response.status} al actualizar el lote.`);
                }

                const newStatus = data.status || (action === 'close' ? 'closed' : 'open');
                const newClosedAt = data.closed_at ? new Date(data.closed_at.replace(' ', 'T')).toLocaleString('es-MX', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : '';
                const newClosedBy = data.closed_by_name || (action === 'close' ? 'Usuario' : '');

                // Update element datasets
                active.element.dataset.status = newStatus;
                active.element.dataset.closedAt = newClosedAt;
                active.element.dataset.closedBy = newClosedBy;

                if (active.isSelect) {
                    const warehouseStr = active.warehouse ? ` · ${active.warehouse}` : '';
                    const statusStr = newStatus === 'closed' ? ' (Cerrado)' : ' (Abierto)';
                    active.element.textContent = `${active.folio}${warehouseStr}${statusStr}`;
                }

                updateRowView();
                updateSummaryCards();
                showToast(data.message || (action === 'close' ? 'Lote cerrado correctamente.' : 'Lote reabierto correctamente.'), 'success');
            } catch (err) {
                if (closeBtn) {
                    closeBtn.disabled = false;
                    closeBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Cerrar lote';
                }
                if (reopenBtn) {
                    reopenBtn.disabled = false;
                    reopenBtn.innerHTML = '<i class="fa-solid fa-lock-open"></i> Abrir lote';
                }
                showToast(err.message || 'Error al conectar con el servidor.', 'error');
            }
        };

        select?.addEventListener('change', updateRowView);
        closeBtn?.addEventListener('click', () => handleStatusChange('close'));
        reopenBtn?.addEventListener('click', () => handleStatusChange('reopen'));

        // Initialize state
        updateRowView();
    });

    const updateSummaryCards = () => {
        let openCount = 0;
        let closedCount = 0;
        let totalCount = 0;
        document.querySelectorAll('[data-assignment-row]').forEach((row) => {
            const select = row.querySelector('[data-lot-select]');
            const singleLot = row.querySelector('[data-single-lot]');
            if (select) {
                Array.from(select.options).forEach(opt => {
                    totalCount++;
                    if ((opt.dataset.status || 'open') === 'closed') {
                        closedCount++;
                    } else {
                        openCount++;
                    }
                });
            } else if (singleLot) {
                totalCount++;
                if ((singleLot.dataset.status || 'open') === 'closed') {
                    closedCount++;
                } else {
                    openCount++;
                }
            }
        });
        const openEl = document.querySelector('[data-summary-open]');
        const closedEl = document.querySelector('[data-summary-closed]');
        const totalEl = document.querySelector('[data-summary-total]');
        if (openEl) openEl.textContent = openCount;
        if (closedEl) closedEl.textContent = closedCount;
        if (totalEl) totalEl.textContent = totalCount;
    };
});
</script>
</body>
</html>
