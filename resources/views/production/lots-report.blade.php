<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Reporte de Lotes - Gestión de la Producción</title>
    <link rel="icon" type="image/png" href="{{ asset('Proagro.png') }}">
    <link rel="shortcut icon" type="image/png" href="{{ asset('Proagro.png') }}">
    <link rel="apple-touch-icon" href="{{ asset('Proagro.png') }}">
    <!-- Fonts & Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
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
            --slate-400: #94a3b8;
            --slate-500: #64748b;
            --slate-600: #475569;
            --slate-700: #334155;
            --slate-800: #1e293b;
            --slate-900: #0f172a;
        }
        * { box-sizing: border-box; }
        html, body {
            width: 100%;
            min-height: 100%;
            margin: 0;
            font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        button, input, select, textarea {
            font-family: inherit;
        }
        html, body, *, *::before, *::after {
            cursor: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAPzSURBVGhD7ddvaBtlGADwW6dIcrn8aTPL5e7eey/J0rTuj+Zyd7nYWTZBC4OBjDDFD/4ZzH/rbO6SNmnWxVVXlVUF8csYm5ulY/hl6wfBb6N2Vq26NVyaIdbRdnWZtritq5VCxyPRL+W++M1k7H5wX573eR54ed/nhSMIi8VisVgsFsv9a2LLFvIHUXzQHL9nTARxviCgLwt+7rMLm0LhCy0tDnNOTSsE8ImCH5UKCH8xhZnVSwKfHd282WPOq1kFjPp/CgrnC340UEK+uckAf+oPzN0ygmivObcmGZg9+Dtm7xT8aPz7R5r3XmHp8g3MLF8KCNlyILDn8tatbnNNTTGCXMAI4g+uCfjc5Y3+VyZZ+kYBcSeLHPsNCAiKPHveXFORSCTWm2NV8Xkisb7E+Zb+4lmY4ugFQ8CfToQC2hxiYJb1rZR4/u3rAb59JBymK/kNB1TJrcUGxH018nLlCaLO4PmcgfHAtB8NGEHh9R+bm5+8iTkwOPZYCTFDKwILMz7mYlhrDdlzypIjKR4196m6ScSM3UIMLPEMXEHMnIGRMSngd39mfTCPGLhGM5/UZaVhsl8FdyrWweitChCwztynKsZirK2E2NkZxKwWEXt2KoAHxzaF24wm/PQ8z8KvtO/2C8+Kr9ZlxLv2rASe9ONvuXT5uqsnVvBq8nNEPl9n7vm/mxCEUNHvf/EXjM5M8+jbqzw7OC4Iu6/yzPLCBnrcllbet/VKYO+RwKlJH1Ga9J3zcBxcGXWlQVd1giCqfxolnvsYBB5uIxZWK0PNs1DE6Kt5Gp0iemJn7T1RqHxkShzx7o9vc3dve+Lh7I7GYEe709yrKhY2MLtXGpnRcqNvaIZmTizT7PBiPZcDgnjAmZK+th+Mgr0rAqQWWQx2tD9krq++vu1NVLfcR/RKZ4hD0jkipwzR6dg7xJHWFm9SPUBmo0uVE3CkRfB2xiLm8qpBr7V63CnlOHUoBrYjKtgrdz0rgi0Xhcq9JzMiODPSaboz/jzVJV0k8wo4k6Js7lM1G5M7GJeuvOTult9wp+RjpB6ZInMy2LsjYNceBVvqsX82RXaLs15NftnZpZz2aq0hc5+qy+ehzqPLg950POlKye850mKZ7FXAnv337ldmgMxK0KjF95hra0JlMClNXHT2xaG+Q34KZXZ6PGlVp1LREYculh1J8TcyFb3jyEh3XbU0A2u5ktFRSo/ebErHqbXxlnzC0ZTeRTXsV8OOrPInlVGm/ftE19qcmuDW1F6Ppvab42vVJ2PPUIdVcOrisHmt6iovEv9m23/+AziT0oeuo23Q0KlkzGv3BABY59bV4w0d8e3mNYvFYrFYLBbLfeJvlaxaRdQ/lIsAAAAASUVORK5CYII=') 4 4, auto !important;
        }
        a, a *, button, button *, input, select, textarea, [role="button"], label, .back-btn, .action {
            cursor: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAPzSURBVGhD7ddvaBtlGADwW6dIcrn8aTPL5e7eey/J0rTuj+Zyd7nYWTZBC4OBjDDFD/4ZzH/rbO6SNmnWxVVXlVUF8csYm5ulY/hl6wfBb6N2Vq26NVyaIdbRdnWZtritq5VCxyPRL+W++M1k7H5wX573eR54ed/nhSMIi8VisVgsFsv9a2LLFvIHUXzQHL9nTARxviCgLwt+7rMLm0LhCy0tDnNOTSsE8ImCH5UKCH8xhZnVSwKfHd282WPOq1kFjPp/CgrnC340UEK+uckAf+oPzN0ygmivObcmGZg9+Dtm7xT8aPz7R5r3XmHp8g3MLF8KCNlyILDn8tatbnNNTTGCXMAI4g+uCfjc5Y3+VyZZ+kYBcSeLHPsNCAiKPHveXFORSCTWm2NV8Xkisb7E+Zb+4lmY4ugFQ8CfToQC2hxiYJb1rZR4/u3rAb59JBymK/kNB1TJrcUGxH018nLlCaLO4PmcgfHAtB8NGEHh9R+bm5+8iTkwOPZYCTFDKwILMz7mYlhrDdlzypIjKR4196m6ScSM3UIMLPEMXEHMnIGRMSngd39mfTCPGLhGM5/UZaVhsl8FdyrWweitChCwztynKsZirK2E2NkZxKwWEXt2KoAHxzaF24wm/PQ8z8KvtO/2C8+Kr9ZlxLv2rASe9ONvuXT5uqsnVvBq8nNEPl9n7vm/mxCEUNHvf/EXjM5M8+jbqzw7OC4Iu6/yzPLCBnrcllbet/VKYO+RwKlJH1Ga9J3zcBxcGXWlQVd1giCqfxolnvsYBB5uIxZWK0PNs1DE6Kt5Gp0iemJn7T1RqHxkShzx7o9vc3dve+Lh7I7GYEe709yrKhY2MLtXGpnRcqNvaIZmTizT7PBiPZcDgnjAmZK+th+Mgr0rAqQWWQx2tD9krq++vu1NVLfcR/RKZ4hD0jkipwzR6dg7xJHWFm9SPUBmo0uVE3CkRfB2xiLm8qpBr7V63CnlOHUoBrYjKtgrdz0rgi0Xhcq9JzMiODPSaboz/jzVJV0k8wo4k6Js7lM1G5M7GJeuvOTult9wp+RjpB6ZInMy2LsjYNceBVvqsX82RXaLs15NftnZpZz2aq0hc5+qy+ehzqPLg950POlKye850mKZ7FXAnv337ldmgMxK0KjF95hra0JlMClNXHT2xaG+Q34KZXZ6PGlVp1LREYculh1J8TcyFb3jyEh3XbU0A2u5ktFRSo/ebErHqbXxlnzC0ZTeRTXsV8OOrPInlVGm/ftE19qcmuDW1F6Ppvab42vVJ2PPUIdVcOrisHmt6iovEv9m23/+AziT0oeuo23Q0KlkzGv3BABY59bV4w0d8e3mNYvFYrFYLBbLfeJvlaxaRdQ/lIsAAAAASUVORK5CYII=') 4 4, pointer !important;
        }
        .sidebar-container,
        .sidebar-container * {
            cursor: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAICSURBVGhD7ddLqM5BGMdx1yTHbSVZqkOWCiskha0sTrJxWRBR2BAi5JJbyUZyj+ycs1C27pedlJWFJJdS7krRR0+eU2/TKTv//8l86635PzPz9DzvzPObmSFDKpVKpVKpVCr/LxiDkaV90IDduIlLmI6uckyrwVk8ww38xHZMLMe1FhxAL47iFS7gI9aUY1sJduILHkfQeIPvuRI9mFDOaRWYimO4jrV4i3N44A+95ZwAw0tbI0Qg+JrBvsd5bMnvH9iHJZic42fldmuHcmEYdmRQ8VuPhZnAaVzJ9l10Z7JHSj+Ng/sZaBDF/BQHO2yn0JftjZiDoaWfRsBovEwZvYbLmI/FGfAnrMOv/N6D13iC5bGKpc9/Tm6PlbiKh5nEslSkUKjDGXxwAo+yHXWytRWrgZMdQfZzO8+GWJl+bmEu5mESxpW+GiH/8TtZuHFCx56PAh+Bex0JfMaocn7jYBr25jaKcyES2Y8Z2NQht8HMcn5jxN0HZzqCG4iLWJFyGswu/TQGpmAVNqT2Py+C7yeUanUm0136aZw81EJ9NuNQ3osGoqec2wqiMLNAg0W5tUIiQ3UimXd58YvzoD010Emq0AeMLexdYctHzze8wPjOMa0Au+KNUNo7wdJcpb6yr3Fy2/z1DYDjmcS2sm9QEFeHlN4FZV+lUqlUKpVK5T/hN9f6MFBO/5D0AAAAAElFTkSuQmCC') 4 4, pointer !important;
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
        .app-sidebar-scroll::-webkit-scrollbar {
            width: 6px;
        }
        .app-sidebar-scroll::-webkit-scrollbar-track {
            background: transparent;
        }
        .app-sidebar-scroll::-webkit-scrollbar-thumb {
            background: #334155;
            border-radius: 9999px;
        }
        .app-sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background: #475569;
        }
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
        .app-brand-logo:hover {
            transform: scale(1.05);
        }
        .app-brand-logo img {
            height: 3rem;
            width: auto;
            object-fit: contain;
            filter: drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15));
            transition: all 0.3s ease;
        }
        .app-brand-text {
            text-align: center;
            transition: all 0.3s ease-in-out;
            white-space: nowrap;
            display: none;
            opacity: 0;
        }
        .app-sidebar:hover .app-brand-text {
            display: block;
            opacity: 1;
        }
        .app-brand-text h2 {
            font-size: 1.125rem;
            font-weight: 700;
            color: #ffffff;
            margin: 0;
        }
        .app-brand-text p {
            font-size: 0.75rem;
            color: #94a3b8;
            margin: 0;
        }
        .app-nav {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding: 0 0.75rem;
        }
        .app-nav-link {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem;
            border-radius: 0.75rem;
            color: #94a3b8;
            text-decoration: none;
            transition: all 0.2s ease;
            position: relative;
        }
        .app-nav-link:hover {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.05);
        }
        .app-nav-link.active {
            background: rgba(30, 41, 59, 0.8);
            color: #ffffff;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .active-indicator {
            position: absolute;
            left: 0;
            top: 0.5rem;
            bottom: 0.5rem;
            width: 0.25rem;
            background: #6366f1;
            border-top-right-radius: 9999px;
            border-bottom-right-radius: 9999px;
        }
        .nav-icon {
            height: 1.5rem;
            width: 1.5rem;
            flex-shrink: 0;
        }
        .app-nav-link span {
            font-size: 0.875rem;
            font-weight: 500;
            white-space: nowrap;
            display: none;
            opacity: 0;
            transition: all 0.3s ease-in-out;
        }
        .app-sidebar:hover .app-nav-link span {
            display: inline;
            opacity: 1;
        }
        .app-sidebar-footer {
            padding: 1rem 0.75rem;
            border-top: 1px solid #1e293b;
            background: rgba(15, 23, 42, 0.5);
        }
        .app-user-card {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .app-user-inner {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            width: 100%;
        }
        .app-avatar {
            width: 2.25rem;
            height: 2.25rem;
            border-radius: 0.5rem;
            background: #6366f1;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.875rem;
            flex-shrink: 0;
        }
        .app-user-meta {
            display: none;
            overflow: hidden;
            white-space: nowrap;
        }
        .app-sidebar:hover .app-user-meta {
            display: block;
        }
        .app-user-name {
            font-size: 0.875rem;
            font-weight: 500;
            color: #ffffff;
            margin: 0;
            text-overflow: ellipsis;
            overflow: hidden;
        }
        .app-user-role {
            font-size: 0.75rem;
            color: #64748b;
            margin: 0;
        }
        .online {
            color: #22c55e;
        }
        .app-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
        }
        .app-header {
            height: 4rem;
            background: #ffffff;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 1.5rem;
            position: sticky;
            top: 0;
            z-index: 40;
        }
        .app-header h1 {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1e293b;
            margin: 0;
        }
        .app-header-user {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .app-header-user span {
            font-size: 0.875rem;
            font-weight: 600;
            color: #334155;
        }
        .app-header-avatar {
            width: 2rem;
            height: 2rem;
            border-radius: 9999px;
            background: #e0e7ff;
            color: #4338ca;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.75rem;
        }
        .logout-btn {
            background: none;
            border: none;
            color: #64748b;
            padding: 0.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s;
        }
        .logout-btn:hover {
            color: #ef4444;
        }
        .page {
            width: 100%;
            max-width: 80rem;
            margin: 0 auto;
            padding: 1.5rem 1rem 3rem;
        }
        @media (min-width: 640px) { .page { padding-left: 1.5rem; padding-right: 1.5rem; } }
        @media (min-width: 1024px) { .page { padding-left: 2rem; padding-right: 2rem; } }

        .nav-row {
            display: flex;
            flex-wrap: wrap;
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

        .shell {
            overflow: hidden;
            border: 1px solid var(--slate-200);
            border-radius: 2rem;
            background: #fff;
            box-shadow: 0 20px 60px -30px rgba(15, 23, 42, .35);
        }
        .hero {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 1.75rem 2rem;
            background: linear-gradient(110deg, var(--sky-700), var(--blue-700) 55%, var(--indigo-800));
            color: #fff;
        }
        .hero-brand {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .hero-brand img {
            width: 52px;
            height: 52px;
            object-fit: contain;
            background: #fff;
            border-radius: 14px;
            padding: 4px;
        }
        .hero-kicker {
            margin: 0;
            color: var(--sky-100);
            font-size: 11px;
            font-weight: 900;
            letter-spacing: .24em;
            text-transform: uppercase;
        }
        .hero h1 {
            margin: 4px 0 0;
            font-size: 1.875rem;
            font-weight: 900;
            letter-spacing: -.02em;
        }
        .hero-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .chip {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            padding: 8px 16px;
            font-size: 12px;
            font-weight: 900;
            letter-spacing: .04em;
            text-transform: uppercase;
        }
        .chip-white { background: #fff; color: var(--sky-700); }
        .chip-trans { background: rgba(255, 255, 255, .12); color: var(--sky-100); border: 1px solid rgba(255, 255, 255, .2); }

        .panel {
            width: 100%;
            padding: 1.5rem 2rem 2rem;
            background: #fff;
        }
        .card {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 1rem 1.5rem;
            width: 100%;
            padding: 1.25rem 1.5rem;
            border: 1px solid var(--slate-200);
            border-radius: 1.25rem;
            background: #fff;
        }
        .card-head {
            grid-column: 1 / -1;
            display: flex;
            flex-wrap: wrap;
            align-items: end;
            justify-content: space-between;
            gap: 8px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--slate-100);
        }
        .card-head h2 {
            margin: 0;
            color: var(--sky-700);
            font-size: 13px;
            font-weight: 900;
            letter-spacing: .08em;
            text-transform: uppercase;
        }
        .card-head p { margin: 0; color: var(--slate-500); font-size: 13px; }

        .history { overflow: auto; }
        .history-filters {
            grid-column: 1 / -1;
            display: flex;
            flex-wrap: wrap;
            align-items: end;
            gap: 12px;
            padding: 12px 14px;
            border: 1px solid var(--sky-100);
            border-radius: 12px;
            background: var(--sky-50);
        }
        .history-filters label {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--sky-700);
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
        }
        .history-filters select, .history-filters input {
            border: 1px solid var(--sky-200);
            border-radius: 10px;
            background: #fff;
            padding: 9px 12px;
            color: var(--slate-700);
            font-weight: 700;
            text-transform: none;
            outline: none;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .history-filters select:hover, .history-filters input:hover {
            border-color: var(--sky-500);
            box-shadow: 0 0 0 3px rgba(2, 132, 199, .08);
        }
        .history-filters select:focus, .history-filters input:focus {
            border-color: var(--sky-600);
            box-shadow: 0 0 0 3px rgba(2, 132, 199, .18);
        }
        .history-filters input[type="date"] {
            cursor: pointer;
        }
        .history-filters input[type="date"]::-webkit-calendar-picker-indicator {
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: background 0.15s ease;
        }
        .history-filters input[type="date"]::-webkit-calendar-picker-indicator:hover {
            background: var(--sky-100);
        }
        .action {
            border: 1px solid var(--sky-200);
            border-radius: 12px;
            background: #fff;
            padding: 9px 16px;
            font-weight: 800;
            color: var(--slate-700);
            cursor: pointer;
            transition: .2s;
        }
        .action:hover { background: var(--sky-50); border-color: var(--sky-600); }
        .btn-excel-report {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #047857;
            border-color: #a7f3d0;
            background: #ecfdf5;
            padding: 9px 16px;
            border-radius: 12px;
            font-weight: 800;
            cursor: pointer;
            transition: .2s;
        }
        .btn-excel-report:hover {
            background: #059669 !important;
            border-color: #059669 !important;
            color: #fff !important;
            box-shadow: 0 4px 12px -2px rgba(5, 150, 105, 0.4);
        }
        .btn-print-report {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: var(--sky-700);
            border-color: var(--sky-200);
            background: #fff;
            padding: 9px 16px;
            border-radius: 12px;
            font-weight: 800;
            cursor: pointer;
            transition: .2s;
        }
        .btn-print-report:hover {
            background: var(--sky-600) !important;
            border-color: var(--sky-600) !important;
            color: #fff !important;
            box-shadow: 0 4px 12px -2px rgba(2, 132, 199, 0.4);
        }

        .lot-multiselect {
            position: relative;
            display: inline-flex;
            flex-direction: column;
        }
        .lot-select-trigger {
            border: 1px solid var(--sky-200);
            border-radius: 12px;
            background: #fff;
            padding: 8px 14px;
            font-weight: 800;
            font-size: 13px;
            color: var(--slate-700);
            min-width: 220px;
            max-width: 280px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .lot-select-trigger:hover {
            border-color: var(--sky-500);
            box-shadow: 0 0 0 3px rgba(2, 132, 199, .08);
        }
        .lot-select-trigger span {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: left;
        }
        .lot-dropdown-panel {
            position: absolute;
            top: calc(100% + 6px);
            left: 0;
            z-index: 100;
            width: 290px;
            background: #ffffff;
            border: 1px solid var(--slate-200);
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            display: none;
            flex-direction: column;
            overflow: hidden;
        }
        .lot-dropdown-panel.open {
            display: flex;
        }
        .lot-dropdown-search {
            padding: 8px 10px;
            border-bottom: 1px solid var(--slate-100);
            background: #f8fafc;
        }
        .lot-dropdown-search input {
            width: 100%;
            padding: 6px 10px;
            border-radius: 8px;
            border: 1px solid var(--slate-200);
            font-size: 12px;
            outline: none;
        }
        .lot-dropdown-header {
            padding: 8px 12px;
            border-bottom: 1px solid var(--slate-100);
            background: #f1f5f9;
        }
        .lot-dropdown-list {
            padding: 6px;
            max-height: 200px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .lot-checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            color: var(--slate-700);
            cursor: pointer;
            transition: background 0.15s;
            user-select: none;
        }
        .lot-checkbox-label:hover {
            background: var(--sky-50);
            color: var(--sky-800);
        }
        .lot-checkbox-label input[type="checkbox"] {
            width: 16px;
            height: 16px;
            accent-color: var(--sky-600);
            cursor: pointer;
            margin: 0;
        }

        .history table {
            grid-column: 1 / -1;
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            overflow: hidden;
            border: 1px solid var(--slate-200);
            border-radius: 12px;
            background: #fff;
            font-size: 13px;
        }
        .history th {
            background: var(--sky-700);
            color: #fff;
            padding: 12px 10px;
            text-align: left;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: .04em;
            text-transform: uppercase;
            white-space: nowrap;
        }
        .history td {
            padding: 12px 10px;
            border-bottom: 1px solid var(--slate-100);
            color: var(--slate-700);
            word-break: break-word;
        }
        .history tr:nth-child(even) td { background: var(--slate-50); }
        .empty-history {
            text-align: center !important;
            color: var(--slate-500) !important;
            font-weight: 700;
            padding: 28px !important;
        }
        .evidence-preview {
            width: 64px;
            height: 46px;
            border: 2px solid var(--sky-600);
            border-radius: 8px;
            object-fit: cover;
            cursor: zoom-in;
        }

        .photo-modal { display: none; position: fixed; inset: 0; z-index: 1200; align-items: center; justify-content: center; background: rgba(15,23,42,.82); padding: 22px; }
        .photo-modal.open { display: flex; }
        .photo-dialog { position: relative; max-width: min(92vw, 900px); max-height: 90vh; border-radius: 18px; background: #071b2a; padding: 12px; box-shadow: 0 25px 70px rgba(0,0,0,.5); }
        .photo-dialog img { display: block; max-width: 86vw; max-height: 82vh; border-radius: 10px; object-fit: contain; }
        .photo-close { position: absolute; right: -12px; top: -12px; width: 34px; height: 34px; border: 1px solid #fff; border-radius: 50%; background: var(--sky-600); color: #fff; font-size: 19px; font-weight: 900; cursor: pointer; }

        @media (max-width: 1100px) {
            .history table { table-layout: auto; min-width: 960px; }
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

        <main class="page">
            <div class="nav-row">
                <a class="back-btn" href="{{ route('apt.production.hub') }}">
                    <i class="fa-solid fa-arrow-left"></i> Volver a Gestión de la producción
                </a>
            </div>

            <div class="shell">
                <header class="hero">
                    <div class="hero-brand">
                        <img src="{{ asset('Proagro.png') }}" alt="Proagroindustria">
                        <div>
                            <p class="hero-kicker">Módulo operativo · APT</p>
                            <h1>Reporte de Lotes</h1>
                        </div>
                    </div>
                    <div class="hero-meta">
                        <span class="chip chip-white">Historial de Lotes</span>
                    </div>
                </header>

                <div class="panel">
                    <section class="card history">
                        <div class="card-head">
                            <h2>HISTORIAL DE LOTES DE PRODUCCIÓN</h2>
                            <p>Consulta el registro histórico de lotes y turnos de producción.</p>
                        </div>
                        <div class="history-filters">
                            <label>Lote(s)
                                <div class="lot-multiselect" data-lot-multiselect>
                                    <button type="button" class="lot-select-trigger" data-lot-trigger>
                                        <span data-lot-trigger-text>
                                            @php
                                                $selectedCount = count($lotIds ?? []);
                                            @endphp
                                            @if($selectedCount === 0)
                                                Todos los lotes
                                            @elseif($selectedCount === 1)
                                                {{ optional($lots->firstWhere('id', ($lotIds ?? [])[0] ?? null))->folio ?: '1 lote seleccionado' }}
                                            @else
                                                {{ $selectedCount }} lotes seleccionados
                                            @endif
                                        </span>
                                        <i class="fa-solid fa-chevron-down" style="font-size: 11px; color: var(--slate-400);"></i>
                                    </button>
                                    <div class="lot-dropdown-panel" data-lot-panel>
                                        <div class="lot-dropdown-search">
                                            <input type="text" placeholder="Buscar lote..." data-lot-search>
                                        </div>
                                        <div class="lot-dropdown-header">
                                            <label class="lot-checkbox-label">
                                                <input type="checkbox" data-lot-select-all @checked($selectedCount === count($lots) && count($lots) > 0)>
                                                <span><strong>Seleccionar todos</strong></span>
                                            </label>
                                        </div>
                                        <div class="lot-dropdown-list">
                                            @foreach($lots as $l)
                                                <label class="lot-checkbox-label" data-lot-item data-lot-folio="{{ strtolower($l->folio) }}">
                                                    <input type="checkbox" value="{{ $l->id }}" data-lot-checkbox data-folio="{{ $l->folio }}" @checked(in_array((string)$l->id, array_map('strval', $lotIds ?? [])))>
                                                    <span>{{ $l->folio }}</span>
                                                </label>
                                            @endforeach
                                        </div>
                                    </div>
                                </div>
                            </label>
                            <label>Turno
                                <select data-filter-shift>
                                    <option value="all" @selected(($shiftFilter ?? 'all') === 'all')>Todos</option>
                                    <option value="Turno 1" @selected(($shiftFilter ?? '') === 'Turno 1')>Turno 1</option>
                                    <option value="Turno 2" @selected(($shiftFilter ?? '') === 'Turno 2')>Turno 2</option>
                                    <option value="Turno 3" @selected(($shiftFilter ?? '') === 'Turno 3')>Turno 3</option>
                                    <option value="Turno 1A" @selected(($shiftFilter ?? '') === 'Turno 1A')>Turno 1A</option>
                                    <option value="Turno 1B" @selected(($shiftFilter ?? '') === 'Turno 1B')>Turno 1B</option>
                                </select>
                            </label>
                            <label>Desde
                                <input type="date" data-filter-from value="{{ $dateFrom ?? '' }}" onclick="try{this.showPicker()}catch(e){}">
                            </label>
                            <label>Hasta
                                <input type="date" data-filter-to value="{{ $dateTo ?? '' }}" onclick="try{this.showPicker()}catch(e){}">
                            </label>
                            <button type="button" class="action" data-clear-filters>Limpiar filtros</button>
                            <div style="margin-left: auto; display: flex; gap: 8px; flex-wrap: wrap;">
                                <button type="button" class="btn-excel-report" data-export-excel title="Exportar reporte de lotes a Excel">
                                    <i class="fa-solid fa-file-excel"></i> Exportar a Excel
                                </button>
                                <button type="button" class="btn-print-report" data-print-report title="Imprimir reporte de lotes filtrado">
                                    <i class="fa-solid fa-print"></i> Imprimir Reporte
                                </button>
                            </div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Hora</th>
                                    <th>No. de lote</th>
                                    <th>Turno</th>
                                    <th>Disposición</th>
                                    <th>Ubicación</th>
                                    <th>Producto</th>
                                    <th>Usuario asignado</th>
                                    <th>Puesto</th>
                                    <th>Evidencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($activities as $act)
                                    @php
                                        $selectedLotIdsForRow = array_map('strval', is_array($lotIds ?? []) ? $lotIds : []);
                                        $lot = null;
                                        if (!empty($selectedLotIdsForRow)) {
                                            $lot = optional($act->shiftStart)->lots?->first(function ($item) use ($selectedLotIdsForRow) {
                                                return in_array((string) $item->id, $selectedLotIdsForRow, true);
                                            }) ?? optional($act->shiftStart)->lot;
                                        } else {
                                            $lot = optional($act->shiftStart)->lot;
                                        }
                                        $product = str_contains(strtoupper((string) optional($lot)->plant_origin), 'UREA')
                                            ? 'UREA AGRICOLA'
                                            : (optional($lot)->plant_origin ?: (optional($lot)->folio ? 'Automático' : '—'));
                                    @endphp
                                    <tr>
                                        <td>{{ $act->occurred_at ? $act->occurred_at->format('d/m/Y') : ($act->created_at ? $act->created_at->format('d/m/Y') : '—') }}</td>
                                        <td>{{ $act->occurred_at ? $act->occurred_at->format('H:i:s') : ($act->created_at ? $act->created_at->format('H:i:s') : '—') }}</td>
                                        <td><strong>{{ optional($lot)->folio ?: '—' }}</strong></td>
                                        <td>{{ optional($act->shiftStart)->shift ?: '—' }}</td>
                                        <td>{{ optional($lot)->warehouse ?: '—' }}</td>
                                        <td>{{ $act->location ?: (optional($lot)->cubicle ?: 'Automático') }}</td>
                                        <td>{{ $product }}</td>
                                        <td>{{ optional($act->user)->name ?: (optional(optional($act->shiftStart)->user)->name ?: '—') }}</td>
                                        <td>{{ optional($act->shiftStart)->position ?: 'Almacén' }}</td>
                                        <td>
                                            @if($act->evidence_path)
                                                <img class="evidence-preview" src="{{ $act->evidenceUrl() }}" alt="Evidencia" data-history-photo>
                                            @else
                                                —
                                            @endif
                                        </td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="10" class="empty-history">
                                            @if(!($hasFilters ?? false))
                                                <i class="fa-solid fa-filter" style="margin-right: 8px;"></i> Selecciona un filtro (Lote, Turno o Rango de fechas) para consultar el historial de lotes.
                                            @else
                                                No hay registros de actividades de lotes para los filtros seleccionados.
                                            @endif
                                        </td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </section>
                </div>
            </div>
        </main>
    </div>
</div>

<div class="photo-modal" data-photo-modal aria-hidden="true">
    <div class="photo-dialog">
        <button type="button" class="photo-close" data-photo-close aria-label="Cerrar vista previa">×</button>
        <img data-photo-modal-image alt="Evidencia fotográfica" />
    </div>
</div>

<script>
    (() => {
        const lotMultiselect = document.querySelector('[data-lot-multiselect]');
        const lotTrigger = document.querySelector('[data-lot-trigger]');
        const lotTriggerText = document.querySelector('[data-lot-trigger-text]');
        const lotPanel = document.querySelector('[data-lot-panel]');
        const lotSearch = document.querySelector('[data-lot-search]');
        const lotSelectAll = document.querySelector('[data-lot-select-all]');
        const lotCheckboxes = document.querySelectorAll('[data-lot-checkbox]');
        const filterShift = document.querySelector('[data-filter-shift]');
        const filterFrom = document.querySelector('[data-filter-from]');
        const filterTo = document.querySelector('[data-filter-to]');
        const printBtn = document.querySelector('[data-print-report]');
        const exportExcelBtn = document.querySelector('[data-export-excel]');
        const historyTbody = document.querySelector('.history table tbody');
        let filterAbortController = null;

        // Toggle multi-select panel
        lotTrigger?.addEventListener('click', (e) => {
            e.stopPropagation();
            lotPanel?.classList.toggle('open');
        });

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!lotMultiselect?.contains(e.target)) {
                lotPanel?.classList.remove('open');
            }
        });

        // Search inside lot dropdown
        lotSearch?.addEventListener('input', () => {
            const query = (lotSearch.value || '').trim().toLowerCase();
            document.querySelectorAll('[data-lot-item]').forEach(item => {
                const folio = item.getAttribute('data-lot-folio') || '';
                item.style.display = folio.includes(query) ? 'flex' : 'none';
            });
        });

        const getSelectedLotIds = () => {
            const selected = [];
            document.querySelectorAll('[data-lot-checkbox]:checked').forEach(cb => {
                if (cb.value) selected.push(cb.value);
            });
            return selected;
        };

        const updateTriggerLabel = () => {
            const checkedCbs = Array.from(document.querySelectorAll('[data-lot-checkbox]:checked'));
            const totalCbs = document.querySelectorAll('[data-lot-checkbox]').length;

            if (checkedCbs.length === 0) {
                if (lotTriggerText) lotTriggerText.textContent = 'Todos los lotes';
            } else if (checkedCbs.length === 1) {
                const folio = checkedCbs[0].getAttribute('data-folio') || '1 lote seleccionado';
                if (lotTriggerText) lotTriggerText.textContent = folio;
            } else if (checkedCbs.length === totalCbs && totalCbs > 0) {
                if (lotTriggerText) lotTriggerText.textContent = 'Todos los lotes (' + totalCbs + ')';
            } else {
                if (lotTriggerText) lotTriggerText.textContent = checkedCbs.length + ' lotes seleccionados';
            }

            if (lotSelectAll) {
                lotSelectAll.checked = checkedCbs.length === totalCbs && totalCbs > 0;
            }
        };

        const fetchFilteredHistory = async () => {
            if (filterAbortController) {
                filterAbortController.abort();
            }
            filterAbortController = new AbortController();

            if (historyTbody) {
                historyTbody.style.opacity = '0.4';
                historyTbody.style.transition = 'opacity 0.15s ease';
            }

            try {
                const currentUrl = new URL(window.location.href);
                const response = await fetch(currentUrl.toString(), {
                    signal: filterAbortController.signal,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'text/html'
                    }
                });

                if (!response.ok) throw new Error('Error al filtrar reporte de lotes');

                const htmlText = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, 'text/html');
                const newTbody = doc.querySelector('.history table tbody');

                if (newTbody && historyTbody) {
                    historyTbody.innerHTML = newTbody.innerHTML;
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error al filtrar reporte de lotes:', err);
                }
            } finally {
                if (historyTbody) {
                    historyTbody.style.opacity = '1';
                }
            }
        };

        const applyFilters = () => {
            const url = new URL(window.location.href);
            const lotIds = getSelectedLotIds();

            if (lotIds.length === 0) {
                url.searchParams.delete('lot_ids');
                url.searchParams.delete('lot_id');
            } else {
                url.searchParams.set('lot_ids', lotIds.join(','));
                url.searchParams.delete('lot_id');
            }

            if (!filterShift || filterShift.value === 'all') {
                url.searchParams.delete('shift');
            } else {
                url.searchParams.set('shift', filterShift.value);
            }

            if (!filterFrom || !filterFrom.value) {
                url.searchParams.delete('date_from');
            } else {
                url.searchParams.set('date_from', filterFrom.value);
            }

            if (!filterTo || !filterTo.value) {
                url.searchParams.delete('date_to');
            } else {
                url.searchParams.set('date_to', filterTo.value);
            }

            updateTriggerLabel();
            window.history.replaceState({}, '', url.pathname + url.search);
            fetchFilteredHistory();
        };

        // Select All toggle
        lotSelectAll?.addEventListener('change', () => {
            const isChecked = lotSelectAll.checked;
            document.querySelectorAll('[data-lot-checkbox]').forEach(cb => {
                cb.checked = isChecked;
            });
            applyFilters();
        });

        // Individual checkbox change
        lotCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                applyFilters();
            });
        });

        filterShift?.addEventListener('change', applyFilters);
        filterFrom?.addEventListener('change', applyFilters);
        filterFrom?.addEventListener('input', applyFilters);
        filterFrom?.addEventListener('click', () => {
            try { if (typeof filterFrom.showPicker === 'function') filterFrom.showPicker(); } catch (e) {}
        });
        filterTo?.addEventListener('change', applyFilters);
        filterTo?.addEventListener('input', applyFilters);
        filterTo?.addEventListener('click', () => {
            try { if (typeof filterTo.showPicker === 'function') filterTo.showPicker(); } catch (e) {}
        });

        document.querySelector('[data-clear-filters]')?.addEventListener('click', () => {
            document.querySelectorAll('[data-lot-checkbox]').forEach(cb => { cb.checked = false; });
            if (lotSelectAll) lotSelectAll.checked = false;
            if (filterShift) filterShift.value = 'all';
            if (filterFrom) filterFrom.value = '';
            if (filterTo) filterTo.value = '';
            updateTriggerLabel();

            const url = new URL(window.location.href);
            url.searchParams.delete('lot_ids');
            url.searchParams.delete('lot_id');
            url.searchParams.delete('shift');
            url.searchParams.delete('date_from');
            url.searchParams.delete('date_to');
            window.history.replaceState({}, '', url.pathname + url.search);
            fetchFilteredHistory();
        });

        const buildExportParams = (baseUrlString) => {
            const targetUrl = new URL(baseUrlString, window.location.origin);
            const lotIds = getSelectedLotIds();
            if (lotIds.length > 0) {
                targetUrl.searchParams.set('lot_ids', lotIds.join(','));
            }
            if (filterShift && filterShift.value !== 'all') {
                targetUrl.searchParams.set('shift', filterShift.value);
            }
            if (filterFrom && filterFrom.value) {
                targetUrl.searchParams.set('date_from', filterFrom.value);
            }
            if (filterTo && filterTo.value) {
                targetUrl.searchParams.set('date_to', filterTo.value);
            }
            return targetUrl;
        };

        printBtn?.addEventListener('click', () => {
            const printUrl = buildExportParams('{{ route('apt.management.lots.report.print') }}');
            window.open(printUrl.toString(), '_blank');
        });

        exportExcelBtn?.addEventListener('click', () => {
            const exportUrl = buildExportParams('{{ route('apt.management.lots.report.export') }}');
            window.location.assign(exportUrl.toString());
        });

        const photoModal = document.querySelector('[data-photo-modal]');
        const photoModalImage = photoModal?.querySelector('[data-photo-modal-image]');
        const openPhoto = (src) => { if (!src || !photoModalImage) return; photoModalImage.src = src; photoModal.classList.add('open'); photoModal.setAttribute('aria-hidden', 'false'); };
        document.querySelector('.history table')?.addEventListener('click', (event) => {
            const img = event.target.closest('[data-history-photo]');
            if (img && img.src) {
                openPhoto(img.src);
            }
        });
        photoModal?.querySelector('[data-photo-close]')?.addEventListener('click', () => { photoModal.classList.remove('open'); photoModal.setAttribute('aria-hidden', 'true'); });
        photoModal?.addEventListener('click', (event) => { if (event.target === photoModal) photoModal.classList.remove('open'); });
    })();
</script>
</body>
</html>
