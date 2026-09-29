<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Gestión de la Producción</title>
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
        a, a *, button, button *, input, select, textarea, [role="button"], label, .back, .btn-save, .btn-capture {
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
            margin: 0;
            font-size: 1.125rem;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #ffffff;
            line-height: 1.2;
        }
        .app-brand-text p {
            margin: 0.25rem 0 0;
            font-size: 0.75rem;
            font-weight: 500;
            color: #94a3b8;
            letter-spacing: 0.05em;
            line-height: 1.2;
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
        .app-nav-link:hover {
            background: rgba(30, 41, 59, 0.5);
            color: #ffffff;
        }
        .app-nav-link.active {
            background: #1e293b;
            color: #ffffff;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -4px rgba(0, 0, 0, 0.2);
        }
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
            transition: color 0.3s;
            color: #64748b;
            flex-shrink: 0;
        }
        .app-nav-link:hover .nav-icon {
            color: #e4e4e7;
        }
        .text-indigo-400 { color: #818cf8 !important; }
        .text-blue-400 { color: #60a5fa !important; }
        .text-orange-400 { color: #fb923c !important; }
        .text-red-400 { color: #f87171 !important; }
        .text-amber-400 { color: #fbbf24 !important; }
        .text-teal-400 { color: #2dd4bf !important; }
        .text-cyan-400 { color: #22d3ee !important; }
        .text-purple-400 { color: #c084fc !important; }
        .text-green-400 { color: #4ade80 !important; }

        .app-nav-link:hover .text-indigo-400 { color: #818cf8 !important; }
        .app-nav-link:hover .text-blue-400 { color: #60a5fa !important; }
        .app-nav-link:hover .text-orange-400 { color: #fb923c !important; }
        .app-nav-link:hover .text-red-400 { color: #f87171 !important; }
        .app-nav-link:hover .text-amber-400 { color: #fbbf24 !important; }
        .app-nav-link:hover .text-teal-400 { color: #2dd4bf !important; }
        .app-nav-link:hover .text-cyan-400 { color: #22d3ee !important; }
        .app-nav-link:hover .text-purple-400 { color: #c084fc !important; }
        .app-nav-link:hover .text-green-400 { color: #4ade80 !important; }

        .app-nav-link span {
            letter-spacing: 0.025em;
            transition: all 0.3s ease-in-out;
            display: none;
            opacity: 0;
            white-space: nowrap;
        }
        .app-sidebar:hover .app-nav-link span {
            display: inline;
            opacity: 1;
        }
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
            transition: all 0.3s ease;
        }
        .app-sidebar:hover .app-user-card {
            justify-content: flex-start;
        }
        .app-user-inner {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            width: 100%;
        }
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
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            margin: 0 auto;
            transition: all 0.3s ease;
        }
        .app-sidebar:hover .app-avatar {
            margin: 0;
        }
        .app-user-meta {
            overflow: hidden;
            transition: all 0.3s ease-in-out;
            white-space: nowrap;
            display: none;
            opacity: 0;
        }
        .app-sidebar:hover .app-user-meta {
            display: block;
            opacity: 1;
        }
        .app-user-name {
            font-size: 0.875rem;
            font-weight: 700;
            color: #ffffff;
            margin: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1.25;
        }
        .app-user-role {
            font-size: 10px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin: 2px 0 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .app-user-role .online {
            color: #34d399;
            font-weight: 600;
        }
        .app-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .app-header {
            position: sticky; top: 0; z-index: 40; height: 64px;
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 24px; background: rgba(255,255,255,.85); border-bottom: 1px solid #e2e8f0;
            backdrop-filter: blur(8px);
        }
        .app-header h1 { margin: 0; font-size: 18px; font-weight: 600; color: #0f172a; }
        .app-header-user { display: flex; align-items: center; gap: 12px; }
        .app-header-user span { font-size: 14px; font-weight: 500; color: #334155; }
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
            min-height: auto;
            margin: 0 auto;
            padding: 1.5rem 1rem 3rem;
        }
        @media (min-width: 640px) { .page { padding-left: 1.5rem; padding-right: 1.5rem; } }
        @media (min-width: 1024px) { .page { padding-left: 2rem; padding-right: 2rem; } }
        .shell {
            overflow: hidden;
            border: 1px solid var(--slate-200);
            border-radius: 2rem;
            background: #fff;
            box-shadow: 0 20px 60px -30px rgba(15, 23, 42, .35);
        }
        .nav-row { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 18px; }
        .back {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: var(--slate-700);
            background: #fff;
            padding: 8px 16px;
            border-radius: 12px;
            border: 1px solid var(--slate-200);
            font-size: 14px;
            font-weight: 700;
            text-decoration: none;
            box-shadow: 0 1px 3px rgba(0, 0, 0, .06);
            transition: all .2s;
        }
        .back:hover { color: var(--sky-700); border-color: var(--sky-200); background: var(--sky-50); }
        .back-subtle { background: transparent; border-color: transparent; box-shadow: none; color: var(--slate-500); }
        .back-subtle:hover { background: transparent; color: var(--sky-700); }
        .hero {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            width: 100%;
            padding: 1.5rem 2rem;
            background: linear-gradient(110deg, var(--sky-700), var(--blue-700) 55%, var(--indigo-800));
            color: #fff;
        }
        .hero-brand { display: flex; align-items: center; gap: 16px; }
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
            color: #e0f2fe;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: .24em;
            text-transform: uppercase;
        }
        .hero h1 { margin: 4px 0 0; font-size: 1.875rem; font-weight: 900; letter-spacing: -.02em; }
        .hero-meta { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            padding: 8px 14px;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: .04em;
            text-transform: uppercase;
        }
        .chip-solid { background: #fff; color: var(--sky-700); }
        .chip-soft { background: rgba(255,255,255,.12); color: #e0f2fe; ring: 1px solid rgba(255,255,255,.2); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
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
            margin-bottom: 1.25rem;
            padding: 1.25rem 1.5rem;
            border: 1px solid var(--slate-200);
            border-radius: 1.25rem;
            background: #fff;
        }
        .card:last-child { margin-bottom: 0; }
        .card-head { grid-column: 1 / -1; display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 8px; padding-bottom: 12px; border-bottom: 1px solid var(--slate-100); }
        .card-head h2 {
            margin: 0;
            color: var(--sky-700);
            font-size: 13px;
            font-weight: 900;
            letter-spacing: .08em;
            text-transform: uppercase;
        }
        .card-head p { margin: 0; color: var(--slate-500); font-size: 13px; }
        .field { display: block; color: var(--sky-700); font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .field input, .field select, .field textarea {
            display: block;
            width: 100%;
            margin-top: 8px;
            border: 1px solid var(--sky-200);
            border-radius: 12px;
            background: #fff;
            padding: 12px 14px;
            min-height: 48px;
            color: var(--slate-700);
            font-size: 14px;
            font-weight: 600;
            font-family: inherit;
            box-shadow: 0 1px 2px rgb(15 23 42 / .05);
        }
        .field input:focus, .field select:focus, .field textarea:focus {
            border-color: var(--sky-600);
            outline: 0;
            box-shadow: 0 0 0 3px rgb(14 165 233 / .15);
        }
        .field input[readonly] { background: var(--slate-50); color: var(--slate-500); cursor: default; }
        .field textarea { min-height: 128px; resize: vertical; }
        .wide { grid-column: span 2; }
        .activity { grid-column: span 2; }
        .activity-types { display: flex; flex-wrap: wrap; align-items: end; gap: 10px; }
        .type-button {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid var(--sky-200);
            border-radius: 999px;
            background: #fff;
            color: var(--sky-700);
            padding: 10px 18px;
            font-size: 14px;
            font-weight: 800;
            cursor: pointer;
        }
        .type-button:hover { background: var(--sky-50); }
        .type-button.active {
            background: var(--sky-600);
            border-color: var(--sky-600);
            color: #fff;
            box-shadow: 0 8px 18px -8px rgba(2, 132, 199, .7);
        }
        .evidence-actions, .save-activity { align-self: end; }
        .evidence-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; grid-column: span 2; }
        .action {
            border: 1px solid var(--sky-200);
            border-radius: 12px;
            background: #fff;
            padding: 12px 16px;
            font-weight: 800;
            color: var(--slate-700);
            cursor: pointer;
            transition: .2s;
        }
        .action:hover { background: var(--sky-50); border-color: var(--sky-600); }
        .action:disabled { cursor: not-allowed; opacity: .65; }
        .save-activity {
            min-width: 170px;
            background: var(--sky-600);
            border-color: var(--sky-600);
            color: #fff;
            box-shadow: 0 10px 20px -12px rgba(2, 132, 199, .8);
        }
        .save-activity:hover { background: var(--sky-700); color: #fff; }
        .evidence-status { color: var(--slate-500); font-size: 12px; font-weight: 700; }
        .evidence-status.error { color: #b42318; }
        .production-toast {
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 200;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            width: min(380px, calc(100vw - 32px));
            padding: 16px 18px;
            border: 1px solid var(--sky-200);
            border-left: 4px solid var(--sky-600);
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.98);
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
            color: var(--slate-800);
            opacity: 0;
            pointer-events: none;
            transform: translateY(-12px);
            transition: opacity .2s ease, transform .2s ease;
        }
        .production-toast.show { opacity: 1; pointer-events: auto; transform: translateY(0); }
        .production-toast.success { border-left-color: #16a34a; }
        .production-toast.error { border-color: #fecaca; border-left-color: #dc2626; }
        .production-toast-icon {
            display: grid;
            flex: 0 0 28px;
            width: 28px;
            height: 28px;
            place-items: center;
            border-radius: 50%;
            background: var(--sky-100);
            color: var(--sky-700);
            font-weight: 900;
        }
        .production-toast.success .production-toast-icon { background: #dcfce7; color: #15803d; }
        .production-toast.error .production-toast-icon { background: #fee2e2; color: #b91c1c; }
        .production-toast-content { flex: 1; min-width: 0; }
        .production-toast-title { margin: 0 0 3px; font-size: 13px; font-weight: 900; color: var(--slate-900); }
        .production-toast-message { margin: 0; font-size: 12px; line-height: 1.45; color: var(--slate-600); }
        .production-toast-close { border: 0; background: transparent; color: var(--slate-400); font-size: 18px; line-height: 1; padding: 0 0 0 4px; cursor: pointer; }
        .production-toast-close:hover { color: var(--slate-700); }
        .production-confirm-backdrop {
            position: fixed;
            inset: 0;
            z-index: 210;
            display: grid;
            place-items: center;
            padding: 1rem;
            background: rgba(15, 23, 42, 0.48);
            opacity: 0;
            pointer-events: none;
            transition: opacity .2s ease;
        }
        .production-confirm-backdrop.show { opacity: 1; pointer-events: auto; }
        .production-confirm {
            width: min(440px, 100%);
            overflow: hidden;
            border: 1px solid var(--sky-200);
            border-radius: 18px;
            background: #fff;
            box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
            transform: translateY(10px) scale(.98);
            transition: transform .2s ease;
        }
        .production-confirm-backdrop.show .production-confirm { transform: translateY(0) scale(1); }
        .production-confirm-head {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 18px 20px;
            background: linear-gradient(135deg, var(--sky-700), var(--blue-700));
            color: #fff;
        }
        .production-confirm-icon {
            display: grid;
            width: 36px;
            height: 36px;
            place-items: center;
            border-radius: 50%;
            background: rgba(255, 255, 255, .18);
            font-size: 18px;
            font-weight: 900;
        }
        .production-confirm-title { margin: 0; font-size: 15px; font-weight: 900; }
        .production-confirm-body { padding: 20px; color: var(--slate-600); font-size: 13px; line-height: 1.55; }
        .production-confirm-actions { display: flex; justify-content: flex-end; gap: 10px; padding: 0 20px 20px; }
        .production-confirm-actions button { min-width: 108px; padding: 10px 16px; border-radius: 10px; font-size: 12px; font-weight: 900; cursor: pointer; }
        .production-confirm-cancel { border: 1px solid var(--slate-200); background: var(--slate-50); color: var(--slate-600); }
        .production-confirm-cancel:hover { background: var(--slate-100); }
        .production-confirm-accept { border: 1px solid var(--sky-700); background: var(--sky-700); color: #fff; box-shadow: 0 8px 16px -10px rgba(3, 105, 161, .9); }
        .production-confirm-accept:hover { background: var(--blue-700); }
        [data-production-close-status] {
            font-weight: 800;
            transition: color .2s ease, border-color .2s ease, background-color .2s ease;
        }
        [data-production-close-status].status-open {
            border-color: #86efac;
            background: #f0fdf4;
            color: #15803d;
        }
        [data-production-close-status].status-closed {
            border-color: #fca5a5;
            background: #fef2f2;
            color: #b91c1c;
        }
        [data-production-close-status].status-empty {
            border-color: var(--slate-300);
            background: var(--slate-100);
            color: var(--slate-500);
        }
        .waiting-card {
            max-width: 660px;
            margin: 32px auto 48px;
            padding: 44px 32px;
            background: #ffffff;
            border: 1px solid var(--slate-200);
            border-radius: 24px;
            box-shadow: 0 20px 45px -10px rgba(15, 23, 42, .08);
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .waiting-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 14px;
            border-radius: 999px;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            color: #1d4ed8;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .05em;
            margin-bottom: 24px;
        }
        .waiting-dot-pulse {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #2563eb;
            box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7);
            animation: pulse-dot 1.8s infinite cubic-bezier(0.66, 0, 0, 1);
        }
        @keyframes pulse-dot {
            to {
                box-shadow: 0 0 0 10px rgba(37, 99, 235, 0);
            }
        }
        .waiting-icon-container {
            position: relative;
            margin-bottom: 22px;
        }
        .waiting-icon-glow {
            position: absolute;
            inset: -12px;
            background: radial-gradient(circle, rgba(2, 132, 199, 0.25) 0%, rgba(2, 132, 199, 0) 70%);
            border-radius: 50%;
            animation: pulse-glow 3s infinite ease-in-out;
        }
        @keyframes pulse-glow {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.15); opacity: 1; }
        }
        .waiting-icon-box {
            position: relative;
            width: 76px;
            height: 76px;
            border-radius: 20px;
            background: linear-gradient(135deg, #0284c7, #1d4ed8);
            color: #ffffff;
            display: grid;
            place-items: center;
            font-size: 32px;
            box-shadow: 0 12px 25px -5px rgba(2, 132, 199, .5);
        }
        .waiting-card h2 {
            margin: 0 0 12px;
            font-size: 22px;
            font-weight: 900;
            color: var(--slate-900);
            letter-spacing: -.02em;
        }
        .waiting-desc {
            margin: 0 0 24px;
            max-width: 500px;
            font-size: 14px;
            line-height: 1.6;
            color: var(--slate-500);
        }
        .waiting-user-pill {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 18px;
            background: var(--slate-50);
            border: 1px solid var(--slate-200);
            border-radius: 14px;
            margin-bottom: 26px;
        }
        .user-avatar-mini {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: #e0f2fe;
            color: #0369a1;
            font-weight: 900;
            font-size: 14px;
            display: grid;
            place-items: center;
        }
        .user-meta-mini {
            text-align: left;
            display: flex;
            flex-direction: column;
        }
        .user-meta-mini strong {
            font-size: 13px;
            color: var(--slate-800);
        }
        .user-meta-mini span {
            font-size: 11px;
            color: var(--slate-500);
            font-weight: 600;
        }
        .waiting-actions {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            width: 100%;
        }
        .btn-check-now {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            border-radius: 12px;
            background: var(--sky-600);
            border: 1px solid var(--sky-600);
            color: #fff;
            font-size: 14px;
            font-weight: 800;
            cursor: pointer;
            box-shadow: 0 8px 18px -6px rgba(2, 132, 199, .6);
            transition: all .2s;
        }
        .btn-check-now:hover {
            background: var(--sky-700);
            transform: translateY(-1px);
        }
        .waiting-polling-text {
            font-size: 12px;
            color: var(--slate-400);
            font-weight: 600;
        }
        .lot-reopen-button { display: none; }
        .lot-reopen-button.visible { display: inline-flex; }
        .btn-finish-shift {
            background: linear-gradient(135deg, var(--slate-800), var(--slate-900));
            border-color: var(--slate-700);
            color: #fff;
            box-shadow: 0 8px 16px -8px rgba(15, 23, 42, .6);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        .btn-finish-shift:hover {
            background: linear-gradient(135deg, var(--slate-900), #000);
            border-color: var(--slate-800);
            color: #fff;
            transform: translateY(-1px);
        }
        .evidence-preview {
            width: 64px;
            height: 46px;
            border: 2px solid var(--sky-600);
            border-radius: 8px;
            object-fit: cover;
            cursor: zoom-in;
        }
        .delete-photo {
            border: 1px solid #fecaca;
            border-radius: 8px;
            background: #fff1f2;
            color: #be123c;
            padding: 8px 10px;
            font-weight: 800;
            cursor: pointer;
        }
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
            cursor: pointer;
            user-select: none;
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
        .btn-print-report {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: var(--sky-700);
            border-color: var(--sky-200);
            background: #fff;
            margin-left: auto;
        }
        .btn-print-report:hover {
            background: var(--sky-600) !important;
            border-color: var(--sky-600) !important;
            color: #fff !important;
            box-shadow: 0 4px 12px -2px rgba(2, 132, 199, 0.4);
        }
        .btn-finish-shift {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: linear-gradient(135deg, #0f172a, #1e293b);
            color: #ffffff !important;
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 10px 18px;
            font-size: 13px;
            font-weight: 800;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(15, 23, 42, .2);
            transition: all .2s ease;
        }
        .btn-finish-shift:hover {
            background: linear-gradient(135deg, #1e293b, #334155);
            border-color: #475569;
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(15, 23, 42, .3);
        }
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
        .history table {
            grid-column: 1 / -1;
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            table-layout: fixed;
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
        .empty-history { text-align: center !important; color: var(--slate-500) !important; font-weight: 700; padding: 28px !important; }
        .camera-panel {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 1000;
            align-items: center;
            justify-content: center;
            background: rgba(15, 23, 42, .78);
            padding: 20px;
        }
        .camera-frame {
            width: min(100%, 430px);
            overflow: hidden;
            border-radius: 24px;
            background: #050b12;
            border: 1px solid rgba(255,255,255,.2);
            box-shadow: 0 25px 60px rgba(0,0,0,.45);
        }
        .camera-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px; color: #fff; font-weight: 800; }
        .camera-panel video { display: block; width: 100%; max-height: 62vh; min-height: 240px; background: #000; object-fit: cover; }
        .camera-actions { display: flex; justify-content: space-between; gap: 8px; padding: 14px; background: #0b1d2a; }
        .camera-actions .action { color: #fff; background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.3); }
        .camera-actions [data-camera-capture] { background: var(--sky-600); border-color: var(--sky-600); }
        .photo-modal { display: none; position: fixed; inset: 0; z-index: 1200; align-items: center; justify-content: center; background: rgba(15,23,42,.82); padding: 22px; }
        .photo-modal.open { display: flex; }
        .photo-dialog { position: relative; max-width: min(92vw, 900px); max-height: 90vh; border-radius: 18px; background: #071b2a; padding: 12px; box-shadow: 0 25px 70px rgba(0,0,0,.5); }
        .photo-dialog img { display: block; max-width: 86vw; max-height: 82vh; border-radius: 10px; object-fit: contain; }
        .photo-close { position: absolute; right: -12px; top: -12px; width: 34px; height: 34px; border: 1px solid #fff; border-radius: 50%; background: var(--sky-600); color: #fff; font-size: 19px; font-weight: 900; cursor: pointer; }
        @media (max-width: 1100px) {
            .history table { table-layout: auto; min-width: 960px; }
        }
        @media (max-width: 850px) {
            .card { grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 16px; }
            .wide, .activity, .evidence-actions { grid-column: span 2; }
            .page { padding: 1rem .75rem 1.5rem; }
            .shell { border-radius: 1.25rem; }
            .hero { padding: 1rem 1.25rem; }
            .hero h1 { font-size: 1.5rem; }
            .panel { padding: .75rem 1rem 1.25rem; }
        }
        @media (max-width: 520px) {
            .card { grid-template-columns: 1fr; }
            .wide, .activity, .evidence-actions { grid-column: span 1; }
        }
    </style>
</head>
<body>
@php
    $authUser = auth()->user();
    $isJefeOrAdmin = (bool) ($authUser && ($authUser->hasRole('Jefe de Almacen') || $authUser->hasRole('Admin') || ($authUser->is_admin ?? false)));
    $isAlmacenista = !$isJefeOrAdmin && $authUser && method_exists($authUser, 'getRoleNames')
        && collect($authUser->getRoleNames())->contains(fn ($role) => str_contains(strtolower($role), 'almac'));
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
<div class="page">
    <div class="nav-row">
        <a class="back-btn" href="{{ $isAlmacenista ? route('apt.production') : route('apt.management') }}">
            <i class="fa-solid fa-arrow-left"></i> Volver a Gestión de la producción
        </a>
    </div>
    <div class="shell">
    <header class="hero">
        <div class="hero-brand">
            <img src="{{ asset('Proagro.png') }}" alt="Proagroindustria">
            <div>
                <p class="hero-kicker">Módulo operativo · APT</p>
                <h1>Gestión de la producción</h1>
            </div>
        </div>
        <div class="hero-meta">
            <span class="chip chip-solid">Generación de lote</span>
        </div>
    </header>
    @php
        $selectedLots = ($registration?->lots?->isNotEmpty()
            ? $registration->lots
            : ($registration?->lot ? collect([$registration->lot]) : collect()))
            ->filter()
            ->sortBy(fn ($lot) => (string) $lot->folio)
            ->values();
        $requestedLotId = (string) ($selectedLotId ?? request('lot_id', ''));
        $activeLot = $selectedLots->firstWhere('id', $requestedLotId) ?: ($selectedLots->count() === 1 ? $selectedLots->first() : null);
        $hasActiveLot = ($registration && $selectedLots->isNotEmpty());
    @endphp

    @if($hasActiveLot)
    <main class="panel" data-shift-id="{{ $registration->id ?? '' }}">
        <section class="card">
            <div class="card-head">
                <h2>Personal a cargo</h2>
                <p>Datos del operador asignado al turno.</p>
            </div>
            <label class="field">Usuario asignado<input readonly value="{{ optional(optional($registration)->user)->name ?: auth()->user()->name }}"></label>
            <label class="field">Puesto<input readonly value="{{ optional($registration)->position ?: (auth()->user()->position ?: 'Almacén') }}"></label>
            <label class="field">Turno<input readonly value="{{ optional($registration)->shift ?: '—' }}"></label>
            <label class="field">Fecha<input readonly value="{{ optional(optional($registration)->started_at)->format('d/m/Y') ?: date('d/m/Y') }}"></label>
        </section>
        <section class="card">
            <div class="card-head">
                <h2>Información de lote de producción en proceso</h2>
                <p>Identificación del lote activo en recepción asignado por el Jefe de Almacén.</p>
            </div>
            <label class="field wide">No. de lote
                <select data-activity-lot {{ $selectedLots->isEmpty() ? 'disabled' : '' }}>
                    @if($selectedLots->count() > 1)
                        <option value="" {{ $requestedLotId === '' ? 'selected' : '' }}>Seleccionar lote...</option>
                    @endif
                    @forelse($selectedLots as $lot)
                        <option value="{{ $lot->id }}"
                            data-product="{{ preg_match('/-UI(?:[-(]|$)/i', (string) $lot->folio) ? 'UREA INDUSTRIAL' : (preg_match('/-UA(?:[-(]|$)/i', (string) $lot->folio) ? 'UREA AGRICOLA' : '—') }}"
                            data-origin="{{ $lot->plant_origin ?: '—' }}"
                            data-warehouse="{{ $lot->warehouse ?: '—' }}"
                            data-status="{{ $lot->pivot?->status ?: 'open' }}"
                            {{ ($activeLot?->id ?? null) == $lot->id ? 'selected' : '' }}>{{ $lot->folio }}</option>
                    @empty
                        <option value="">—</option>
                    @endforelse
                </select>
            </label>
            <label class="field">Producto<input data-activity-product readonly value="{{ preg_match('/-UI(?:[-(]|$)/i', (string) $activeLot?->folio) ? 'UREA INDUSTRIAL' : (preg_match('/-UA(?:[-(]|$)/i', (string) $activeLot?->folio) ? 'UREA AGRICOLA' : '—') }}"></label>
            <label class="field">Origen<input data-activity-origin readonly value="{{ $activeLot?->plant_origin ?: '—' }}"></label>
            <label class="field">Disposición<input data-activity-warehouse readonly value="{{ $activeLot?->warehouse ?: '—' }}"></label>
            <label class="field">Inicio<input readonly value="{{ optional(optional($registration)->started_at)->format('d/m/Y') ?: '—' }}"></label>
            <label class="field">Final<input readonly value="{{ $registration ? 'EN PROCESO' : '—' }}"></label>
            <label class="field">Status de Producción
                <input data-production-close-status
                    class="{{ ($activeLot?->pivot?->status ?: 'open') === 'closed' ? 'status-closed' : 'status-open' }}"
                    readonly
                    value="{{ ($activeLot?->pivot?->status ?: 'open') === 'closed' ? 'Cerrado' : 'Abierto' }}">
            </label>
            @if($registration)
                @if($canCloseLot ?? false)
                    <button type="button" class="action" data-close-production-lot disabled>Cerrar lote actual</button>
                    <button type="button" class="action lot-reopen-button" data-reopen-production-lot>Abrir lote</button>
                @endif
                <button type="button" class="action btn-finish-shift" data-finish-shift title="Finalizar el turno actual">
                    <i class="fa-solid fa-flag-checkered"></i> Finalizar turno
                </button>
            @endif
        </section>

        <section class="card" data-activity-form>
            <div class="card-head">
                <h2>Registro de actividades del turno</h2>
                <p>La hora se actualiza hasta el momento de guardar.</p>
            </div>
            <div class="field wide activity-types" role="group" aria-label="Tipo de registro">
                Tipo
                <div>
                    <button type="button" class="type-button active" data-type="incidencia" aria-pressed="true"><span class="type-mark" aria-hidden="true">◉</span> Incidencias</button>
                    <button type="button" class="type-button" data-type="relevancia" aria-pressed="false"><span class="type-mark" aria-hidden="true">◯</span> Relevancias</button>
                </div>
            </div>
            <label class="field">Hora<input data-activity-time readonly value=""></label>
            <label class="field activity">Captura<textarea placeholder="Captura la incidencia"></textarea></label>
            <label class="field">Ubicación<input data-activity-location placeholder="EJEM. C21-C22"></label>
            <div class="evidence-actions">
                <button class="action" data-evidence-button type="button">＋ 📷 Evidencia fotográfica</button>
                <span data-evidence-status class="evidence-status">Sin evidencia</span>
                <img data-evidence-preview class="evidence-preview" alt="Abrir evidencia fotográfica" hidden>
                <button class="delete-photo" data-delete-photo type="button" hidden>Eliminar fotografía</button>
            </div>
            <button class="action save-activity" data-save-activity type="button">💾 Guardar</button>
        </section>

        <section class="card history">
            <div class="card-head">
                <h2>Historial de incidencias y/o relevancias del día</h2>
                <p>Consulta los registros guardados del turno.</p>
            </div>
            <div class="history-filters">
                <label>Tipo
                    <select data-history-type>
                        <option value="all" @selected(($activityType ?? 'all') === 'all')>Todas</option>
                        <option value="incidencia" @selected(($activityType ?? '') === 'incidencia')>Incidencias</option>
                        <option value="relevancia" @selected(($activityType ?? '') === 'relevancia')>Relevancias</option>
                    </select>
                </label>
                <label class="filter-date-label">Fecha
                    <input type="date" data-history-date value="{{ $activityDate ?? '' }}" onclick="try{this.showPicker()}catch(e){}">
                </label>
                <button type="button" class="action" data-clear-filters>Limpiar filtros</button>
                <button type="button" class="action btn-print-report" data-print-report title="Imprimir reporte de historial filtrado">
                    <i class="fa-solid fa-print"></i> Imprimir Reporte
                </button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>No. de lote</th>
                        <th>Disposición</th>
                        <th>Ubicación</th>
                        <th>Producto</th>
                        <th>Descripción</th>
                        <th>Usuario</th>
                        <th>Evidencia</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($activities as $activity)
                        @php
                            $displayLot = null;
                            if (!empty($selectedLotId)) {
                                $displayLot = $selectedLots->firstWhere('id', $selectedLotId);
                            }
                            if (!$displayLot) {
                                $displayLot = optional($activity->shiftStart)->lot ?: optional($registration)->lot;
                            }
                            $displayWarehouse = optional($displayLot)->warehouse ?: '—';
                            $displayFolio = (string) optional($displayLot)->folio;
                            $displayProduct = preg_match('/-UI(?:[-(]|$)/i', $displayFolio)
                                ? 'UREA INDUSTRIAL'
                                : (preg_match('/-UA(?:[-(]|$)/i', $displayFolio)
                                    ? 'UREA AGRICOLA'
                                    : (optional($displayLot)->plant_origin ?: ($displayFolio ? 'Automático' : '—')));
                        @endphp
                        <tr>
                            <td>{{ $activity->occurred_at ? $activity->occurred_at->format('d/m/Y') : '—' }}</td>
                            <td>{{ $activity->occurred_at ? $activity->occurred_at->format('H:i:s') : '—' }}</td>
                            <td>{{ optional($displayLot)->folio ?: '—' }}</td>
                            <td>{{ $displayWarehouse }}</td>
                            <td>{{ $activity->location ?: 'Automático' }}</td>
                            <td>{{ $displayProduct }}</td>
                            <td>{{ ucfirst($activity->type) }}: {{ $activity->description }}</td>
                            <td>{{ optional($activity->user)->name ?: '—' }}</td>
                            <td>
                                @if($activity->evidence_path)
                                    <img class="evidence-preview" src="{{ $activity->evidenceUrl() }}" alt="Evidencia" data-history-photo>
                                @else
                                    —
                                @endif
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="9" class="empty-history">No hay actividades guardadas.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </section>
    </main>
    @else
    <main class="panel-waiting">
        <div class="waiting-card">
            <div class="waiting-badge">
                <span class="waiting-dot-pulse"></span>
                <span>Esperando Asignación de Lote</span>
            </div>

            <div class="waiting-icon-container">
                <div class="waiting-icon-glow"></div>
                <div class="waiting-icon-box">
                    <i class="fa-solid fa-boxes-stacked"></i>
                </div>
            </div>

            <h2>Esperando asignación de lote de producción</h2>
            <p class="waiting-desc">
                Actualmente no tienes ningún lote de producción activo asignado. Esta pantalla se actualizará automáticamente y te redirigirá directamente al formulario en cuanto el <strong>Jefe de Almacén</strong> te asigne un lote.
            </p>

            <div class="waiting-user-pill">
                <div class="user-avatar-mini">{{ mb_substr(auth()->user()->name, 0, 1) }}</div>
                <div class="user-meta-mini">
                    <strong>{{ auth()->user()->name }}</strong>
                    <span>{{ auth()->user()->position ?: 'Operador de Almacén' }}</span>
                </div>
            </div>
        </div>
    </main>
    @endif
    </div>
</div>
    </div>
</div>
<div class="photo-modal" data-photo-modal aria-hidden="true">
    <div class="photo-dialog">
        <button type="button" class="photo-close" data-photo-close aria-label="Cerrar vista previa">×</button>
        <img data-photo-modal-image alt="Evidencia fotográfica" />
    </div>
</div>
<div class="production-toast" data-production-toast role="status" aria-live="polite">
    <span class="production-toast-icon" data-production-toast-icon>✓</span>
    <div class="production-toast-content">
        <p class="production-toast-title" data-production-toast-title>Operación completada</p>
        <p class="production-toast-message" data-production-toast-message></p>
    </div>
    <button type="button" class="production-toast-close" data-production-toast-close aria-label="Cerrar notificación">×</button>
</div>
<div class="production-confirm-backdrop" data-production-confirm aria-hidden="true">
    <div class="production-confirm" role="dialog" aria-modal="true" aria-labelledby="production-confirm-title">
        <div class="production-confirm-head">
            <span class="production-confirm-icon">!</span>
            <p class="production-confirm-title" id="production-confirm-title">Confirmar cierre de lote</p>
        </div>
        <div class="production-confirm-body">¿Deseas cerrar este lote para la asignación actual? Podrá reasignarse en un nuevo ciclo.</div>
        <div class="production-confirm-actions">
            <button type="button" class="production-confirm-cancel" data-production-confirm-cancel>Cancelar</button>
            <button type="button" class="production-confirm-accept" data-production-confirm-accept>Cerrar lote</button>
        </div>
    </div>
</div>
<script>
    (() => {
        const filterType = document.querySelector('[data-history-type]');
        const filterDate = document.querySelector('[data-history-date]');
        const activityLot = document.querySelector('[data-activity-lot]');
        const historyTbody = document.querySelector('.history table tbody');
        let filterAbortController = null;

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

                if (!response.ok) throw new Error('Error al filtrar historial');

                const htmlText = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, 'text/html');
                const newTbody = doc.querySelector('.history table tbody');

                if (newTbody && historyTbody) {
                    historyTbody.innerHTML = newTbody.innerHTML;
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error al filtrar historial:', err);
                }
            } finally {
                if (historyTbody) {
                    historyTbody.style.opacity = '1';
                }
            }
        };

        const applyHistoryFilters = () => {
            const url = new URL(window.location.href);
            if (!filterType || filterType.value === 'all') {
                url.searchParams.delete('activity_type');
            } else {
                url.searchParams.set('activity_type', filterType.value);
            }

            if (!filterDate || !filterDate.value) {
                url.searchParams.delete('activity_date');
            } else {
                url.searchParams.set('activity_date', filterDate.value);
            }

            if (!activityLot || !activityLot.value) {
                url.searchParams.delete('lot_id');
            } else {
                url.searchParams.set('lot_id', activityLot.value);
            }

            window.history.replaceState({}, '', url.pathname + url.search);
            fetchFilteredHistory();
        };

        filterType?.addEventListener('change', applyHistoryFilters);
        filterDate?.addEventListener('change', applyHistoryFilters);
        filterDate?.addEventListener('input', applyHistoryFilters);
        activityLot?.addEventListener('change', () => {
            syncActivityLot();
            applyHistoryFilters();
        });
        filterDate?.addEventListener('click', () => {
            try {
                if (typeof filterDate.showPicker === 'function') {
                    filterDate.showPicker();
                }
            } catch (e) {}
        });
        document.querySelector('[data-clear-filters]')?.addEventListener('click', () => {
            if (filterType) filterType.value = 'all';
            if (filterDate) filterDate.value = '';
            if (activityLot) {
                activityLot.value = '';
            }
            const url = new URL(window.location.href);
            url.searchParams.delete('activity_type');
            url.searchParams.delete('activity_date');
            url.searchParams.delete('lot_id');
            window.history.replaceState({}, '', url.pathname + url.search);
            fetchFilteredHistory();
        });

        const shiftId = document.querySelector('[data-shift-id]')?.dataset.shiftId;
        const printBtn = document.querySelector('[data-print-report]');
        printBtn?.addEventListener('click', () => {
            const printUrl = new URL('{{ route('apt.management.activity.print') }}', window.location.origin);
            if (shiftId) {
                printUrl.searchParams.set('shift_id', shiftId);
            }
            if (activityLot && activityLot.value) {
                printUrl.searchParams.set('lot_id', activityLot.value);
            }
            if (filterType && filterType.value !== 'all') {
                printUrl.searchParams.set('activity_type', filterType.value);
            }
            if (filterDate && filterDate.value) {
                printUrl.searchParams.set('activity_date', filterDate.value);
            }
            window.open(printUrl.toString(), '_blank');
        });

        const activityProduct = document.querySelector('[data-activity-product]');
        const activityOrigin = document.querySelector('[data-activity-origin]');
        const activityWarehouse = document.querySelector('[data-activity-warehouse]');
        const productionCloseStatus = document.querySelector('[data-production-close-status]');
        const closeProductionLotButton = document.querySelector('[data-close-production-lot]');
        const reopenProductionLotButton = document.querySelector('[data-reopen-production-lot]');
        const productionToast = document.querySelector('[data-production-toast]');
        const productionToastIcon = document.querySelector('[data-production-toast-icon]');
        const productionToastTitle = document.querySelector('[data-production-toast-title]');
        const productionToastMessage = document.querySelector('[data-production-toast-message]');
        const productionConfirm = document.querySelector('[data-production-confirm]');
        const productionConfirmAccept = document.querySelector('[data-production-confirm-accept]');
        const productionConfirmCancel = document.querySelector('[data-production-confirm-cancel]');
        let productionToastTimer = null;
        let productionConfirmResolver = null;
        const showProductionToast = (message, type = 'success', title = null) => {
            if (!productionToast) return;
            clearTimeout(productionToastTimer);
            productionToast.className = `production-toast show ${type}`;
            productionToastIcon.textContent = type === 'success' ? '✓' : '!';
            productionToastTitle.textContent = title || (type === 'success' ? 'Lote cerrado' : 'No se pudo completar');
            productionToastMessage.textContent = message;
            productionToastTimer = setTimeout(() => productionToast.classList.remove('show'), 5000);
        };
        document.querySelector('[data-production-toast-close]')?.addEventListener('click', () => productionToast?.classList.remove('show'));
        const askProductionConfirmation = (message = '¿Deseas cerrar este lote para la asignación actual? Podrá reasignarse en un nuevo ciclo.', actionLabel = 'Cerrar lote', title = 'Confirmar cierre de lote') => new Promise((resolve) => {
            productionConfirmResolver = resolve;
            const confirmationBody = productionConfirm?.querySelector('.production-confirm-body');
            const confirmationAccept = productionConfirm?.querySelector('[data-production-confirm-accept]');
            const confirmationTitle = productionConfirm?.querySelector('.production-confirm-title');
            if (confirmationBody) confirmationBody.textContent = message;
            if (confirmationAccept) confirmationAccept.textContent = actionLabel;
            if (confirmationTitle) confirmationTitle.textContent = title;
            productionConfirm?.classList.add('show');
            productionConfirm?.setAttribute('aria-hidden', 'false');
        });
        const closeProductionConfirmation = (confirmed) => {
            productionConfirm?.classList.remove('show');
            productionConfirm?.setAttribute('aria-hidden', 'true');
            productionConfirmResolver?.(confirmed);
            productionConfirmResolver = null;
        };
        productionConfirmAccept?.addEventListener('click', () => closeProductionConfirmation(true));
        productionConfirmCancel?.addEventListener('click', () => closeProductionConfirmation(false));
        productionConfirm?.addEventListener('click', (event) => {
            if (event.target === productionConfirm) closeProductionConfirmation(false);
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && productionConfirm?.classList.contains('show')) closeProductionConfirmation(false);
        });
        const syncActivityLot = () => {
            const option = activityLot?.options[activityLot.selectedIndex];
            if (!option) return;
            if (activityProduct) activityProduct.value = option.dataset.product || '—';
            if (activityOrigin) activityOrigin.value = option.dataset.origin || '—';
            if (activityWarehouse) activityWarehouse.value = option.dataset.warehouse || '—';
            if (productionCloseStatus) {
                const isClosed = option.dataset.status === 'closed';
                productionCloseStatus.value = isClosed ? 'Cerrado' : 'Abierto';
                productionCloseStatus.classList.toggle('status-open', !isClosed);
                productionCloseStatus.classList.toggle('status-closed', isClosed);
            }
            if (closeProductionLotButton) {
                closeProductionLotButton.disabled = !activityLot?.value || option.dataset.status === 'closed';
                closeProductionLotButton.textContent = option.dataset.status === 'closed' ? 'Lote cerrado' : 'Cerrar lote actual';
            }
            if (reopenProductionLotButton) {
                reopenProductionLotButton.classList.toggle('visible', option.dataset.status === 'closed');
                reopenProductionLotButton.disabled = !activityLot?.value || option.dataset.status !== 'closed';
            }
        };
        syncActivityLot();

        reopenProductionLotButton?.addEventListener('click', async () => {
            if (!activityLot?.value || !shiftId || reopenProductionLotButton.disabled) return;
            if (!(await askProductionConfirmation('¿Deseas reabrir este lote para la asignación actual?', 'Abrir lote', 'Confirmar Reapertura de Lote'))) return;

            reopenProductionLotButton.disabled = true;
            reopenProductionLotButton.textContent = 'Abriendo...';
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const currentPath = window.location.pathname.replace(/\/apt\/management\/activity\/?$/, '');
            const reopenUrl = `${currentPath}/apt/management/activity/lot/${encodeURIComponent(shiftId)}/${encodeURIComponent(activityLot.value)}/reopen`;
            try {
                const response = await fetch(reopenUrl, { method: 'PATCH', credentials: 'same-origin', headers: { 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
                const result = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(result.message || `No se pudo reabrir el lote (${response.status}).`);
                activityLot.options[activityLot.selectedIndex].dataset.status = 'open';
                syncActivityLot();
                showProductionToast(result.message || 'El lote se reabrió correctamente.', 'success', 'Lote abierto');
            } catch (error) {
                reopenProductionLotButton.disabled = false;
                reopenProductionLotButton.textContent = 'Abrir lote';
                showProductionToast(error.message || 'No se pudo reabrir el lote.', 'error');
            }
        });

        closeProductionLotButton?.addEventListener('click', async () => {
            if (!activityLot?.value || !shiftId || closeProductionLotButton.disabled) return;
            if (!(await askProductionConfirmation())) return;

            closeProductionLotButton.disabled = true;
            closeProductionLotButton.textContent = 'Cerrando...';
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const currentPath = window.location.pathname.replace(/\/apt\/management\/activity\/?$/, '');
            const closeUrl = `${currentPath}/apt/management/activity/lot/${encodeURIComponent(shiftId)}/${encodeURIComponent(activityLot.value)}/close`;
            try {
                const response = await fetch(closeUrl, {
                    method: 'PATCH',
                    credentials: 'same-origin',
                    headers: {
                        'X-CSRF-TOKEN': csrf,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });
                const result = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(result.message || Object.values(result.errors || {}).flat()[0] || `No se pudo cerrar el lote (${response.status}).`);
                }
                const selectedOption = activityLot.options[activityLot.selectedIndex];
                selectedOption.dataset.status = 'closed';
                syncActivityLot();
                showProductionToast(result.message || 'El lote se cerró correctamente.');
            } catch (error) {
                closeProductionLotButton.disabled = false;
                closeProductionLotButton.textContent = 'Cerrar lote actual';
                showProductionToast(error.message || 'No se pudo cerrar el lote.', 'error');
            }
        });

        const finishShiftButton = document.querySelector('[data-finish-shift]');
        finishShiftButton?.addEventListener('click', () => {
            if (!activityLot) return;

            const validOptions = Array.from(activityLot.options).filter(opt => opt.value !== '');
            const pendingLotOption = validOptions.find(opt => (opt.dataset.status || 'open') !== 'closed');

            if (pendingLotOption) {
                activityLot.value = pendingLotOption.value;
                syncActivityLot();
                activityLot.dispatchEvent(new Event('change'));
                activityLot.focus();
                activityLot.scrollIntoView({ behavior: 'smooth', block: 'center' });

                const folio = pendingLotOption.textContent.trim();
                showProductionToast(
                    `El lote "${folio}" aún se encuentra abierto. Primero se necesita tener cerrado los lotes para poder finalizar el turno.`,
                    'error',
                    'Lote pendiente'
                );
            } else {
                showProductionToast(
                    'Todos los lotes del turno han sido cerrados correctamente. Finalizando turno y redirigiendo al inicio...',
                    'success',
                    'Turno finalizado'
                );

                setTimeout(() => {
                    window.location.href = "{{ route('dashboard') }}";
                }, 1000);
            }
        });

        const activity = document.querySelector('[data-activity-form]');
        if (!activity || !shiftId) return;
        let type = 'incidencia';
        const capture = activity.querySelector('textarea');
        const location = activity.querySelector('[data-activity-location]');
        const timeInput = activity.querySelector('[data-activity-time]');
        const pad = (value) => String(value).padStart(2, '0');
        const nowLocal = () => {
            const now = new Date();
            return {
                clock: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
                stamp: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
            };
        };
        const tickClock = () => { timeInput.value = nowLocal().clock; };
        tickClock();
        let clockTimer = setInterval(tickClock, 1000);
        const evidenceButton = activity.querySelector('[data-evidence-button]');
        const saveButton = activity.querySelector('[data-save-activity]');
        const evidenceStatus = activity.querySelector('[data-evidence-status]');
        const evidencePreview = activity.querySelector('[data-evidence-preview]');
        const deletePhotoButton = activity.querySelector('[data-delete-photo]');
        const photoModal = document.querySelector('[data-photo-modal]');
        const photoModalImage = photoModal?.querySelector('[data-photo-modal-image]');
        const openPhoto = (src) => { if (!src || !photoModalImage) return; photoModalImage.src = src; photoModal.classList.add('open'); photoModal.setAttribute('aria-hidden', 'false'); };
        evidencePreview?.addEventListener('click', () => openPhoto(evidencePreview.src));
        document.querySelector('.history table')?.addEventListener('click', (event) => {
            const img = event.target.closest('[data-history-photo]');
            if (img && img.src) {
                openPhoto(img.src);
            }
        });
        photoModal.querySelector('[data-photo-close]').addEventListener('click', () => { photoModal.classList.remove('open'); photoModal.setAttribute('aria-hidden', 'true'); });
        photoModal.addEventListener('click', (event) => { if (event.target === photoModal) photoModal.classList.remove('open'); });
        const cameraPanel = document.createElement('div');
        cameraPanel.className = 'camera-panel';
        cameraPanel.innerHTML = '<div class="camera-frame"><div class="camera-toolbar"><span>📷 Evidencia fotográfica</span><button type="button" class="action" data-camera-cancel aria-label="Cerrar cámara">✕</button></div><video autoplay playsinline muted></video><div class="camera-actions"><button type="button" class="action" data-camera-cancel>Cancelar</button><button type="button" class="action" data-camera-capture>Tomar foto</button></div></div>';
        activity.appendChild(cameraPanel);
        const video = cameraPanel.querySelector('video');
        let cameraStream = null;
        let capturedEvidence = null;
        let evidenceBeforeCamera = null;
        let previewBeforeCamera = '';
        activity.querySelectorAll('[data-type]').forEach((button) => button.addEventListener('click', () => {
            type = button.dataset.type;
            activity.querySelectorAll('[data-type]').forEach((item) => {
                const selected = item === button;
                item.classList.toggle('active', selected);
                item.setAttribute('aria-pressed', selected ? 'true' : 'false');
                const mark = item.querySelector('.type-mark');
                if (mark) mark.textContent = selected ? '◉' : '◯';
            });
            capture.placeholder = type === 'incidencia' ? 'Captura la incidencia' : 'Captura la relevancia';
        }));
        const openCamera = async () => {
            evidenceStatus.classList.remove('error');
            evidenceBeforeCamera = capturedEvidence;
            previewBeforeCamera = evidencePreview.src;
            try {
                cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
                video.srcObject = cameraStream;
                cameraPanel.style.display = 'flex';
            } catch {
                evidenceStatus.textContent = 'No fue posible abrir la cámara';
                evidenceStatus.classList.add('error');
            }
        };
        evidenceButton.addEventListener('click', openCamera);
        deletePhotoButton.addEventListener('click', () => {
            capturedEvidence = null;
            evidencePreview.src = '';
            evidencePreview.hidden = true;
            deletePhotoButton.hidden = true;
            evidenceButton.textContent = '＋ 📷 Evidencia fotográfica';
            evidenceStatus.textContent = 'Sin evidencia';
            evidenceStatus.classList.remove('error');
        });
        const cancelCamera = () => {
            cameraStream?.getTracks().forEach((track) => track.stop()); cameraStream = null;
            video.srcObject = null; cameraPanel.style.display = 'none';
            capturedEvidence = evidenceBeforeCamera;
            evidencePreview.src = previewBeforeCamera;
            evidencePreview.hidden = !capturedEvidence;
            deletePhotoButton.hidden = !capturedEvidence;
            evidenceButton.disabled = false;
            evidenceButton.textContent = capturedEvidence ? '✓ Foto tomada' : '＋ 📷 Evidencia fotográfica';
            evidenceStatus.textContent = capturedEvidence ? '1 evidencia lista' : 'Sin evidencia';
        };
        cameraPanel.querySelectorAll('[data-camera-cancel]').forEach((button) => button.addEventListener('click', cancelCamera));
        cameraPanel.querySelector('[data-camera-capture]').addEventListener('click', () => {
            const canvas = document.createElement('canvas'); canvas.width = video.videoWidth || 1280; canvas.height = video.videoHeight || 720;
            canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                if (!blob) return;
                capturedEvidence = new File([blob], `evidencia-${Date.now()}.jpg`, { type: 'image/jpeg' });
                evidencePreview.src = URL.createObjectURL(capturedEvidence);
                evidencePreview.hidden = false;
                deletePhotoButton.hidden = false;
                cameraStream?.getTracks().forEach((track) => track.stop()); cameraStream = null; video.srcObject = null; cameraPanel.style.display = 'none';
                evidenceButton.textContent = '↻ Volver a tomar foto'; evidenceButton.disabled = false; evidenceStatus.textContent = '1 evidencia lista';
            }, 'image/jpeg', 0.88);
        });
        saveButton.addEventListener('click', async () => {
            if (!capture.value.trim()) { capture.focus(); capture.setCustomValidity('Captura una actividad antes de guardar.'); capture.reportValidity(); return; }
            if (!capturedEvidence) { evidenceStatus.textContent = 'Toma una evidencia fotográfica para continuar'; evidenceStatus.classList.add('error'); evidenceButton.disabled = false; evidenceButton.focus(); return; }
            capture.setCustomValidity('');
            clearInterval(clockTimer);
            const savedAt = nowLocal();
            timeInput.value = savedAt.clock;
            saveButton.disabled = true; saveButton.textContent = 'Guardando...';
            const payload = new FormData();
            payload.append('production_shift_start_id', shiftId); payload.append('type', type); payload.append('description', capture.value.trim()); payload.append('location', location.value.trim());
            payload.append('occurred_at', savedAt.stamp);
            payload.append('evidence', capturedEvidence);
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            try {
                const response = await fetch('{{ route('apt.management.activity.store') }}', { method: 'POST', body: payload, credentials: 'same-origin', headers: { 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
                if (response.ok) {
                    await fetchFilteredHistory();
                    capture.value = '';
                    location.value = '';
                    capturedEvidence = null;
                    evidencePreview.src = '';
                    evidencePreview.hidden = true;
                    deletePhotoButton.hidden = true;
                    evidenceButton.textContent = '＋ 📷 Evidencia fotográfica';
                    evidenceStatus.textContent = 'Sin evidencia';
                    return;
                }
                const result = await response.json().catch(() => ({}));
                const message = result.message || Object.values(result.errors || {}).flat()[0] || 'No se pudo guardar la actividad.';
                evidenceStatus.textContent = message;
                evidenceStatus.classList.add('error');
            } catch (error) {
                evidenceStatus.textContent = 'No se pudo conectar con el servidor.';
                evidenceStatus.classList.add('error');
            }
            saveButton.disabled = false;
            saveButton.textContent = '💾 Guardar';
            clockTimer = setInterval(tickClock, 1000);
        });

        const waitingPanel = document.querySelector('.panel-waiting');
        if (waitingPanel) {
            let isChecking = false;
            const checkAssignment = async () => {
                if (isChecking) return;
                isChecking = true;
                try {
                    const checkUrl = "{{ route('apt.management.check.assigned.lots') }}";
                    const response = await fetch(checkUrl, {
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    });
                    const data = await response.json().catch(() => ({}));
                    if (data.has_active_lots && data.redirect_url) {
                        showProductionToast('¡Se te ha asignado un lote! Redirigiendo al lote generado...', 'success', 'Lote asignado');
                        setTimeout(() => {
                            window.location.href = data.redirect_url;
                        }, 600);
                    }
                } catch (e) {
                    console.error('Error al comprobar asignación:', e);
                } finally {
                    isChecking = false;
                }
            };

            const autoPollTimer = setInterval(checkAssignment, 3000);
        }
    })();

</script>
</body>
</html>
