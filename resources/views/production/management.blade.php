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
            --emerald-50: #ecfdf5;
            --emerald-200: #a7f3d0;
            --emerald-600: #059669;
            --emerald-700: #047857;
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
        a, a *, button, button *, input, select, textarea, [role="button"], label, .back-btn, .btn-save {
            cursor: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAPzSURBVGhD7ddvaBtlGADwW6dIcrn8aTPL5e7eey/J0rTuj+Zyd7nYWTZBC4OBjDDFD/4ZzH/rbO6SNmnWxVVXlVUF8csYm5ulY/hl6wfBb6N2Vq26NVyaIdbRdnWZtritq5VCxyPRL+W++M1k7H5wX573eR54ed/nhSMIi8VisVgsFsv9a2LLFvIHUXzQHL9nTARxviCgLwt+7rMLm0LhCy0tDnNOTSsE8ImCH5UKCH8xhZnVSwKfHd282WPOq1kFjPp/CgrnC340UEK+uckAf+oPzN0ygmivObcmGZg9+Dtm7xT8aPz7R5r3XmHp8g3MLF8KCNlyILDn8tatbnNNTTGCXMAI4g+uCfjc5Y3+VyZZ+kYBcSeLHPsNCAiKPHveXFORSCTWm2NV8Xkisb7E+Zb+4lmY4ugFQ8CfToQC2hxiYJb1rZR4/u3rAb59JBymK/kNB1TJrcUGxH018nLlCaLO4PmcgfHAtB8NGEHh9R+bm5+8iTkwOPZYCTFDKwILMz7mYlhrDdlzypIjKR4196m6ScSM3UIMLPEMXEHMnIGRMSngd39mfTCPGLhGM5/UZaVhsl8FdyrWweitChCwztynKsZirK2E2NkZxKwWEXt2KoAHxzaF24wm/PQ8z8KvtO/2C8+Kr9ZlxLv2rASe9ONvuXT5uqsnVvBq8nNEPl9n7vm/mxCEUNHvf/EXjM5M8+jbqzw7OC4Iu6/yzPLCBnrcllbet/VKYO+RwKlJH1Ga9J3zcBxcGXWlQVd1giCqfxolnvsYBB5uIxZWK0PNs1DE6Kt5Gp0iemJn7T1RqHxkShzx7o9vc3dve+Lh7I7GYEe709yrKhY2MLtXGpnRcqNvaIZmTizT7PBiPZcDgnjAmZK+th+Mgr0rAqQWWQx2tD9krq++vu1NVLfcR/RKZ4hD0jkipwzR6dg7xJHWFm9SPUBmo0uVE3CkRfB2xiLm8qpBr7V63CnlOHUoBrYjKtgrdz0rgi0Xhcq9JzMiODPSaboz/jzVJV0k8wo4k6Js7lM1G5M7GJeuvOTult9wp+RjpB6ZInMy2LsjYNceBVvqsX82RXaLs15NftnZpZz2aq0hc5+qy+ehzqPLg950POlKye850mKZ7FXAnv337ldmgMxK0KjF95hra0JlMClNXHT2xaG+Q34KZXZ6PGlVp1LREYculh1J8TcyFb3jyEh3XbU0A2u5ktFRSo/ebErHqbXxlnzC0ZTeRTXsV8OOrPInlVGm/ftE19qcmuDW1F6Ppvab42vVJ2PPUIdVcOrisHmt6iovEv9m23/+AziT0oeuo23Q0KlkzGv3BABY59bV4w0d8e3mNYvFYrFYLBbLfeJvlaxaRdQ/lIsAAAAASUVORK5CYII=') 4 4, pointer !important;
        }
        .sidebar-container,
        .sidebar-container * {
            cursor: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAICSURBVGhD7ddLqM5BGMdx1yTHbSVZqkOWCiskha0sTrJxWRBR2BAi5JJbyUZyj+ycs1C27pedlJWFJJdS7krRR0+eU2/TKTv//8l86635PzPz9DzvzPObmSFDKpVKpVKpVCr/LxiDkaV90IDduIlLmI6uckyrwVk8ww38xHZMLMe1FhxAL47iFS7gI9aUY1sJduILHkfQeIPvuRI9mFDOaRWYimO4jrV4i3N44A+95ZwAw0tbI0Qg+JrBvsd5bMnvH9iHJZic42fldmuHcmEYdmRQ8VuPhZnAaVzJ9l10Z7JHSj+Ng/sZaBDF/BQHO2yn0JftjZiDoaWfRsBovEwZvYbLmI/FGfAnrMOv/N6D13iC5bGKpc9/Tm6PlbiKh5nEslSkUKjDGXxwAo+yHXWytRWrgZMdQfZzO8+GWJl+bmEu5mESxpW+GiH/8TtZuHFCx56PAh+Bex0JfMaocn7jYBr25jaKcyES2Y8Z2NQht8HMcn5jxN0HZzqCG4iLWJFyGswu/TQGpmAVNqT2Py+C7yeUanUm0136aZw81EJ9NuNQ3osGoqec2wqiMLNAg0W5tUIiQ3UimXd58YvzoD010Emq0AeMLexdYctHzze8wPjOMa0Au+KNUNo7wdJcpb6yr3Fy2/z1DYDjmcS2sm9QEFeHlN4FZV+lUqlUKpVK5T/hN9f6MFBO/5D0AAAAAElFTkSuQmCC') 4 4, pointer !important;
        }
        .page {
            width: 100%;
            max-width: 80rem;
            min-height: auto;
            margin: 0 auto;
            padding: 1.5rem 1rem 3rem;
        }
        @media (min-width: 640px) { .page { padding-left: 1.5rem; padding-right: 1.5rem; } }
        .page {
            width: 100%;
            max-width: 80rem;
            min-height: auto;
            margin: 0 auto;
            padding: 1.5rem 1rem 3rem;
            animation: pageFadeIn 0.35s ease;
        }
        @keyframes pageFadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 640px) { .page { padding-left: 1.5rem; padding-right: 1.5rem; } }
        @media (min-width: 1024px) { .page { padding-left: 2rem; padding-right: 2rem; } }

        .app-main {
            background-color: #f8fafc;
            background-image: radial-gradient(at 0% 0%, rgba(2, 132, 199, 0.06) 0px, transparent 45%), radial-gradient(at 100% 100%, rgba(79, 70, 229, 0.05) 0px, transparent 45%);
        }

        .nav-row {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
        }
        .back-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            color: #334155;
            background: #ffffff;
            padding: 10px 20px;
            border-radius: 14px;
            border: 1.5px solid #e2e8f0;
            font-size: 13.5px;
            font-weight: 700;
            text-decoration: none;
            box-shadow: 0 2px 5px rgba(15, 23, 42, 0.04);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .back-btn i {
            transition: transform 0.2s ease;
            color: #0284c7;
        }
        .back-btn:hover {
            color: #0284c7;
            border-color: #bae6fd;
            background: #f0f9ff;
            box-shadow: 0 4px 14px rgba(2, 132, 199, 0.12);
            transform: translateY(-1px);
        }
        .back-btn:hover i {
            transform: translateX(-3px);
        }
        .back-subtle {
            background: transparent;
            border-color: transparent;
            box-shadow: none;
            color: var(--slate-500);
        }
        .back-subtle:hover {
            background: transparent;
            color: var(--sky-700);
            transform: none;
        }

        .shell {
            overflow: visible;
            border: 1px solid rgba(226, 232, 240, 0.9);
            border-radius: 1.75rem;
            background: #ffffff;
            box-shadow: 0 20px 45px -15px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.02);
            transition: box-shadow 0.3s ease;
        }
        .shell:hover {
            box-shadow: 0 25px 55px -15px rgba(15, 23, 42, 0.11), 0 0 0 1px rgba(15, 23, 42, 0.03);
        }

        .hero {
            position: relative;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            padding: 2rem 2.5rem;
            background: linear-gradient(135deg, #091e42 0%, #1e40af 60%, #0284c7 100%);
            color: #ffffff;
            border-radius: 1.75rem 1.75rem 0 0;
            overflow: hidden;
        }
        .hero::before {
            content: '';
            position: absolute;
            top: 0; right: 0; bottom: 0; left: 0;
            background: radial-gradient(circle at 85% 20%, rgba(56, 189, 248, 0.22) 0%, transparent 60%);
            pointer-events: none;
        }
        .hero-brand {
            position: relative;
            display: flex;
            align-items: center;
            gap: 18px;
            z-index: 1;
        }
        .hero-back-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.14);
            color: #fff;
            text-decoration: none;
            border: 1px solid rgba(255, 255, 255, 0.22);
            backdrop-filter: blur(8px);
            transition: background 0.2s, transform 0.2s;
        }
        .hero-back-icon:hover {
            background: rgba(255, 255, 255, 0.24);
            transform: scale(1.05);
        }
        .hero-brand img {
            width: 56px;
            height: 56px;
            object-fit: contain;
            background: #ffffff;
            border-radius: 16px;
            padding: 6px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.2);
        }
        .hero-kicker {
            margin: 0;
            color: #7dd3fc;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.22em;
            text-transform: uppercase;
        }
        .hero h1 {
            margin: 4px 0 0;
            font-size: 1.85rem;
            font-weight: 900;
            letter-spacing: -0.025em;
            color: #ffffff;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }
        .hero-meta {
            position: relative;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 10px;
            z-index: 1;
        }
        .chip {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border-radius: 9999px;
            padding: 8px 18px;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
        }
        .chip-white {
            background: rgba(255, 255, 255, 0.95);
            color: #0369a1;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
            backdrop-filter: blur(8px);
        }
        .chip-pulse {
            width: 8px;
            height: 8px;
            border-radius: 9999px;
            background: #10b981;
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            animation: chipPulseAnim 2s infinite;
        }
        @keyframes chipPulseAnim {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .chip-trans {
            background: rgba(255, 255, 255, 0.14);
            color: #e0f2fe;
            border: 1px solid rgba(255, 255, 255, 0.22);
            backdrop-filter: blur(4px);
        }

        .form-body {
            padding: 2.25rem 2.5rem;
        }
        @media (max-width: 640px) {
            .form-body { padding: 1.5rem; }
            .hero { padding: 1.5rem; }
        }

        .form-top-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 14px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 1.25rem;
            margin-bottom: 2rem;
        }
        .form-top-bar p {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: #64748b;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .required-badge {
            font-size: 11px;
            font-weight: 800;
            color: #e11d48;
            background: #ffe4e6;
            padding: 4px 10px;
            border-radius: 9999px;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }

        .grid-3 {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.75rem;
        }
        @media (min-width: 1024px) {
            .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
        }

        .field-group {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        .field-label {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #334155;
            margin-bottom: 8px;
        }
        .field-label-main {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .field-label i {
            color: #0284c7;
            font-size: 13px;
        }
        .tag-auto {
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            background: #f1f5f9;
            padding: 2px 7px;
            border-radius: 6px;
            letter-spacing: normal;
        }

        .field-control {
            width: 100%;
            height: 48px;
            border-radius: 12px;
            border: 1.5px solid #e2e8f0;
            background: #ffffff;
            padding: 0 16px;
            font-size: 14.5px;
            font-weight: 600;
            color: #0f172a;
            outline: none;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
            transition: all 0.2s ease;
        }
        select.field-control {
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 14px center;
            padding-right: 42px;
            cursor: pointer;
        }
        .field-control:hover:not(:read-only) {
            border-color: #cbd5e1;
            background: #fafafa;
        }
        .field-control:focus {
            border-color: #0284c7;
            background: #ffffff;
            box-shadow: 0 0 0 3.5px rgba(2, 132, 199, 0.15);
        }
        .field-control:read-only {
            background: #f8fafc;
            border: 1.5px dashed #cbd5e1;
            color: #475569;
            cursor: default;
        }

        .lot-field {
            width: 100%;
        }
        .lot-dropdown {
            position: relative;
            width: 100%;
        }
        .lot-dropdown summary {
            position: relative;
            display: flex;
            align-items: center;
            width: 100%;
            height: 48px;
            box-sizing: border-box;
            border: 1.5px solid #e2e8f0;
            border-radius: 12px;
            background: #ffffff;
            padding: 0 42px 0 16px;
            color: #0f172a;
            font-size: 14.5px;
            font-weight: 600;
            cursor: pointer;
            list-style: none;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
            transition: all 0.2s ease;
        }
        .lot-dropdown summary::-webkit-details-marker { display: none; }
        .lot-dropdown summary::after {
            content: '';
            position: absolute;
            top: 50%;
            right: 16px;
            width: 7px;
            height: 7px;
            border-right: 2.2px solid #64748b;
            border-bottom: 2.2px solid #64748b;
            transform: translateY(-65%) rotate(45deg);
            transition: transform 0.2s ease;
        }
        .lot-dropdown[open] summary {
            border-color: #0284c7;
            box-shadow: 0 0 0 3.5px rgba(2, 132, 199, 0.15);
            border-radius: 12px;
        }
        .lot-dropdown[open] summary::after {
            transform: translateY(-35%) rotate(225deg);
            border-color: #0284c7;
        }
        .lot-dropdown[open] { z-index: 40; }
        .lot-dropdown .lot-checkboxes {
            position: absolute;
            top: calc(100% + 8px);
            left: 0;
            right: 0;
            z-index: 60;
            max-height: 240px;
            overflow-y: auto;
            padding: 10px;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            background: #ffffff;
            box-shadow: 0 18px 40px -5px rgba(15, 23, 42, 0.16);
            animation: dropFadeIn 0.2s ease;
        }
        @keyframes dropFadeIn {
            from { opacity: 0; transform: translateY(-6px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .lot-checkbox {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            color: #1e293b;
            font-size: 13.5px;
            font-weight: 600;
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.15s ease;
        }
        .lot-checkbox:hover {
            background: #f0f9ff;
            color: #0284c7;
        }
        .lot-checkbox input {
            width: 17px;
            height: 17px;
            accent-color: #0284c7;
            cursor: pointer;
        }
        .lot-accept {
            width: 100%;
            margin-top: 8px;
            padding: 10px 14px;
            border: none;
            border-radius: 10px;
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
            color: #ffffff;
            font-size: 13.5px;
            font-weight: 800;
            letter-spacing: 0.02em;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
            transition: all 0.2s ease;
        }
        .lot-accept:hover {
            filter: brightness(1.08);
            transform: translateY(-1px);
        }

        .selected-lots-container {
            animation: fadeInLots 0.25s ease;
        }
        @keyframes fadeInLots {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .date-box {
            display: flex;
            align-items: center;
            gap: 14px;
            height: 48px;
            border-radius: 12px;
            border: 1.5px solid #e2e8f0;
            background: #f8fafc;
            padding: 0 16px;
            color: #0f172a;
            font-weight: 700;
            font-size: 14.5px;
        }
        .date-icon-wrap {
            width: 30px;
            height: 30px;
            border-radius: 8px;
            background: #e0f2fe;
            color: #0284c7;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
        }

        .btn-save {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            height: 48px;
            width: 100%;
            border-radius: 12px;
            border: none;
            background: linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%);
            color: #ffffff;
            font-size: 15px;
            font-weight: 800;
            letter-spacing: 0.02em;
            cursor: pointer;
            box-shadow: 0 8px 20px -4px rgba(2, 132, 199, 0.42), 0 3px 6px -2px rgba(29, 78, 216, 0.2);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-save:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px -4px rgba(2, 132, 199, 0.52);
            filter: brightness(1.05);
        }
        .btn-save:active {
            transform: translateY(0);
            filter: brightness(0.96);
        }
        .btn-save:disabled {
            opacity: 0.65;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .alert-error {
            display: none;
            background: #fff1f2;
            border: 1.5px solid #fecdd3;
            color: #be123c;
            padding: 14px 18px;
            border-radius: 14px;
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 24px;
            box-shadow: 0 4px 12px rgba(225, 29, 72, 0.08);
            animation: dropFadeIn 0.25s ease;
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
                @if($authUser?->hasRole('Admin') || $authUser?->can('view commercialization') || $authUser?->can('view documentation'))
                <a href="{{ route('clients.index') }}" class="app-nav-link" title="Clientes">
                    <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
                    <span>Clientes</span>
                </a>
                @endif
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
            <div class="hero">
                <div class="hero-brand">
                    <img src="{{ asset('Proagro.png') }}" alt="Proagroindustria">
                    <div>
                        <p class="hero-kicker">Módulo operativo · APT</p>
                        <h1>Gestión de la producción</h1>
                    </div>
                </div>
                <div class="hero-meta">
                    <span class="chip chip-white">
                        <span class="chip-pulse"></span>
                        Lote en recepción
                    </span>
                </div>
            </div>

            @if($canManageShift)
            <form id="shiftForm" class="form-body" method="POST" action="{{ route('apt.management.shift.store') }}">
                @csrf
                <div id="errorBox" class="alert-error"></div>

                <div class="form-top-bar">
                    <p><i class="fa-solid fa-circle-info" style="color: #0284c7;"></i> Completa los datos para iniciar el turno y generar el lote.</p>
                    <span class="required-badge"><i class="fa-solid fa-asterisk" style="font-size: 8px;"></i> Campos obligatorios</span>
                </div>

                <div class="grid-3">
                    <div class="field-group">
                        <label>
                            <span class="field-label">
                                <span class="field-label-main"><i class="fa-solid fa-user"></i> Usuario asignado</span>
                                <span class="tag-auto" style="color: #0284c7; background: #e0f2fe;">Requerido</span>
                            </span>
                            <select id="user_id" name="user_id" required class="field-control">
                                <option value="" selected disabled>Seleccionar usuario</option>
                                @foreach($users as $u)
                                    @php
                                        $userPosition = $u->position ?: ($u->level ?: ($u->roles->pluck('name')->first() ?: 'Almacén'));
                                    @endphp
                                    <option value="{{ $u->id }}" data-position="{{ $userPosition }}">
                                        {{ $u->name }}
                                    </option>
                                @endforeach
                            </select>
                        </label>
                        <label>
                            <span class="field-label">
                                <span class="field-label-main"><i class="fa-solid fa-clipboard-list"></i> Turno</span>
                                <span class="tag-auto" style="color: #0284c7; background: #e0f2fe;">Requerido</span>
                            </span>
                            <select id="shift" name="shift" required class="field-control">
                                <option value="" selected disabled>Seleccionar turno</option>
                                <option value="Turno 1">Turno 1</option>
                                <option value="Turno 2">Turno 2</option>
                                <option value="Turno 3">Turno 3</option>
                                <option value="Turno 1A">Turno 1A</option>
                                <option value="Turno 1B">Turno 1B</option>
                            </select>
                        </label>
                    </div>

                    <div class="field-group">
                        <label>
                            <span class="field-label">
                                <span class="field-label-main"><i class="fa-solid fa-id-badge"></i> Puesto</span>
                                <span class="tag-auto">Automático</span>
                            </span>
                            <input type="text" id="position" name="position" value="" placeholder="—" readonly class="field-control">
                        </label>
                        <div class="lot-field">
                            <span class="field-label">
                                <span class="field-label-main"><i class="fa-solid fa-box-open"></i> Lote en recepción</span>
                                <span class="tag-auto" style="color: #0284c7; background: #e0f2fe;">Requerido</span>
                            </span>
                            <details class="lot-dropdown">
                                <summary data-lot-summary>Seleccionar lote(s)</summary>
                                <div class="lot-checkboxes">
                                    @foreach($lots as $l)
                                        <label class="lot-checkbox">
                                            <input type="checkbox" name="lot_ids[]" value="{{ $l->id }}" data-lot-name="{{ $l->folio }}">
                                            <span>{{ $l->folio }}</span>
                                        </label>
                                    @endforeach
                                    <button type="button" id="btn-aceptar" class="lot-accept">Aceptar</button>
                                </div>
                            </details>
                        </div>
                        <div id="selectedLotsContainer" class="selected-lots-container" style="display: none;">
                            <label>
                                <span class="field-label">
                                    <span class="field-label-main"><i class="fa-solid fa-boxes-stacked"></i> Lotes seleccionados</span>
                                </span>
                                <select id="selected_lots_dropdown" class="field-control">
                                </select>
                            </label>
                        </div>
                    </div>

                    <div class="field-group" style="justify-content: space-between;">
                        <div>
                            <span class="field-label">
                                <span class="field-label-main"><i class="fa-solid fa-calendar-days"></i> Fecha</span>
                                <span class="tag-auto">Hoy</span>
                            </span>
                            <div class="date-box">
                                <div class="date-icon-wrap">
                                    <i class="fa-solid fa-calendar-day"></i>
                                </div>
                                <span>{{ $latestRegistration ? $latestRegistration->started_at->format('d/m/Y') : date('d/m/Y') }}</span>
                            </div>
                        </div>
                        <button type="submit" id="saveBtn" class="btn-save">
                            <i class="fa-solid fa-floppy-disk"></i> Guardar registro
                        </button>
                    </div>
                </div>
            </form>
            @else
            <div class="form-body">
                <div class="form-top-bar">
                    <p><i class="fa-solid fa-circle-info" style="color: #0284c7;"></i> {{ $latestRegistration ? 'Información del lote y turno asignado por el Jefe de Almacén.' : 'Información del turno y lote en recepción (Sin lote asignado).' }}</p>
                    <span class="required-badge" style="{{ $latestRegistration ? 'color: #0369a1; background: #e0f2fe;' : 'color: #64748b; background: #f1f5f9;' }}">{{ $latestRegistration ? 'Lote activo' : 'Sin datos' }}</span>
                </div>

                <div class="grid-3" style="margin-bottom: 1.5rem;">
                    <div class="field-group">
                        <div>
                            <span class="field-label">
                                <span class="field-label-main"><i class="fa-solid fa-user"></i> Usuario asignado</span>
                            </span>
                            <div class="field-control" style="background: var(--slate-50); color: var(--slate-800); font-weight: 700; display: flex; align-items: center;">
                                {{ $latestRegistration ? ($latestRegistration->user?->name ?: auth()->user()->name) : (auth()->user()->name ?: '—') }}
                            </div>
                        </div>
                        <div>
                            <span class="field-label">
                                <span class="field-label-main"><i class="fa-solid fa-clipboard-list"></i> Turno</span>
                            </span>
                            <div class="field-control" style="background: var(--slate-50); color: {{ $latestRegistration ? 'var(--slate-800)' : 'var(--slate-400)' }}; font-weight: 700; display: flex; align-items: center;">
                                {{ $latestRegistration ? $latestRegistration->shift : '—' }}
                            </div>
                        </div>
                    </div>

                    <div class="field-group">
                        <div>
                            <span class="field-label">
                                <span class="field-label-main"><i class="fa-solid fa-id-badge"></i> Puesto</span>
                            </span>
                            <div class="field-control" style="background: var(--slate-50); color: var(--slate-800); font-weight: 700; display: flex; align-items: center;">
                                {{ $latestRegistration ? ($latestRegistration->position ?: 'Almacén') : (auth()->user()->position ?: 'Almacén') }}
                            </div>
                        </div>
                        <div>
                            <span class="field-label">
                                <span class="field-label-main"><i class="fa-solid fa-box-open"></i> Lote en recepción</span>
                            </span>
                            <div class="field-control" style="background: {{ $latestRegistration ? '#eff6ff' : 'var(--slate-50)' }}; color: {{ $latestRegistration ? '#1d4ed8' : 'var(--slate-400)' }}; font-weight: 800; border-color: {{ $latestRegistration ? '#bfdbfe' : 'var(--slate-200)' }}; display: flex; align-items: center;">
                                {{ $latestRegistration ? ($latestRegistration->lot?->folio ?: 'Lote asignado') : '—' }}
                            </div>
                        </div>
                    </div>

                    <div class="field-group" style="justify-content: space-between;">
                        <div>
                            <span class="field-label">
                                <span class="field-label-main"><i class="fa-solid fa-calendar-days"></i> Fecha</span>
                                <span class="tag-auto">Hoy</span>
                            </span>
                            <div class="date-box">
                                <div class="date-icon-wrap">
                                    <i class="fa-solid fa-calendar-day"></i>
                                </div>
                                <span>{{ $latestRegistration ? $latestRegistration->started_at->format('d/m/Y') : date('d/m/Y') }}</span>
                            </div>
                        </div>
                        <a href="{{ route('apt.management.activity') }}" class="btn-save" style="text-decoration: none;">
                            <i class="fa-solid fa-eye"></i> Ver lote y actividades
                        </a>
                    </div>
                </div>
            </div>
            @endif
        </div>
    </main>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const userSelect = document.getElementById('user_id');
            const posInput = document.getElementById('position');
            const form = document.getElementById('shiftForm');
            const saveBtn = document.getElementById('saveBtn');
            const errorBox = document.getElementById('errorBox');
            const lotSummary = document.querySelector('[data-lot-summary]');
            const lotDropdown = document.querySelector('.lot-dropdown');
            const acceptButton = document.getElementById('btn-aceptar');
            const lotCheckboxes = Array.from(document.querySelectorAll('input[name="lot_ids[]"]'));
            const selectedLotsContainer = document.getElementById('selectedLotsContainer');
            const selectedLotsDropdown = document.getElementById('selected_lots_dropdown');

            const syncLotSummary = () => {
                if (!lotSummary) return;
                const selectedFolios = lotCheckboxes
                    .filter((checkbox) => checkbox.checked)
                    .map((checkbox) => checkbox.dataset.lotName)
                    .filter(Boolean);
                if (selectedFolios.length > 2) {
                    lotSummary.textContent = `${selectedFolios.length} seleccionados`;
                } else if (selectedFolios.length > 0) {
                    lotSummary.textContent = selectedFolios.join(', ');
                } else {
                    lotSummary.textContent = 'Seleccionar lote(s)';
                }
            };

            const updateSelectedLotsDropdown = () => {
                if (!selectedLotsDropdown || !selectedLotsContainer) return;
                const selectedCheckboxes = lotCheckboxes.filter((checkbox) => checkbox.checked);

                selectedLotsDropdown.innerHTML = '';

                if (selectedCheckboxes.length > 0) {
                    selectedCheckboxes.forEach((checkbox) => {
                        const opt = document.createElement('option');
                        opt.value = checkbox.value;
                        opt.textContent = checkbox.dataset.lotName || checkbox.value;
                        selectedLotsDropdown.appendChild(opt);
                    });
                    selectedLotsContainer.style.display = 'block';
                } else {
                    selectedLotsContainer.style.display = 'none';
                }
            };

            window.updateLotSummary = syncLotSummary;

            lotDropdown?.addEventListener('change', syncLotSummary);
            acceptButton?.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                syncLotSummary();
                updateSelectedLotsDropdown();
                lotDropdown?.removeAttribute('open');
            });
            syncLotSummary();
            updateSelectedLotsDropdown();

            if (userSelect && posInput) {
                const syncPosition = () => {
                    const opt = userSelect.options[userSelect.selectedIndex];
                    if (opt && opt.value) {
                        posInput.value = opt.getAttribute('data-position') || 'Almacén';
                    } else {
                        posInput.value = '';
                    }
                };

                userSelect.addEventListener('change', syncPosition);
                userSelect.addEventListener('input', syncPosition);
                syncPosition();
            }

            if (form && saveBtn) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    if (errorBox) errorBox.style.display = 'none';
                    if (!lotCheckboxes.some((checkbox) => checkbox.checked)) {
                        if (errorBox) {
                            errorBox.textContent = 'Selecciona al menos un lote en recepción.';
                            errorBox.style.display = 'block';
                        }
                        return;
                    }
                    saveBtn.disabled = true;
                    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

                    const formData = new FormData(form);
                    const basePath = @json(rtrim((string) (parse_url((string) config('app.url'), PHP_URL_PATH) ?: ''), '/'));

                    try {
                        const res = await fetch(form.action, {
                            method: 'POST',
                            body: formData,
                            headers: {
                                'X-Requested-With': 'XMLHttpRequest',
                                'Accept': 'application/json'
                            }
                        });

                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) {
                            const firstError = data.errors ? Object.values(data.errors).flat()[0] : null;
                            throw new Error(firstError || data.message || `Error ${res.status} al guardar`);
                        }

                        const targetUrl = data.redirect_url || `${basePath}/apt/management/activity`;
                        window.location.assign(targetUrl);
                    } catch (err) {
                        if (errorBox) {
                            errorBox.textContent = err.message || 'Error al guardar el registro';
                            errorBox.style.display = 'block';
                        }
                        saveBtn.disabled = false;
                        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar registro';
                    }
                });
            }
        });
    </script>
    </div>
</div>
</body>
</html>
