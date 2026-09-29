<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Formato GLS-AP-FO-005 - {{ $attendance->folio ?: 'Control de Asistencias' }}</title>
    <link rel="icon" type="image/png" href="{{ asset('Proagro.png') }}">
    <link rel="shortcut icon" type="image/png" href="{{ asset('Proagro.png') }}">
    <link rel="apple-touch-icon" href="{{ asset('Proagro.png') }}">
    <!-- Fonts & Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; }
        html, body {
            margin: 0;
            padding: 0;
            background: #e2e8f0;
            font-family: 'Inter', Arial, sans-serif;
            color: #000000;
        }

        .no-print {
            display: block;
        }

        .screen-toolbar {
            position: sticky;
            top: 12px;
            z-index: 100;
            max-width: 820px;
            margin: 12px auto 20px;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(8px);
            padding: 12px 20px;
            border-radius: 16px;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            color: #fff;
        }

        .btn-tool {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 700;
            text-decoration: none;
            transition: all .2s;
            cursor: pointer;
            border: none;
        }
        .btn-tool-dark { background: rgba(255,255,255,0.15); color: #fff; }
        .btn-tool-dark:hover { background: rgba(255,255,255,0.25); }
        .btn-tool-blue { background: #0284c7; color: #fff; }
        .btn-tool-blue:hover { background: #0369a1; }
        .btn-tool-green { background: #059669; color: #fff; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4); }
        .btn-tool-green:hover { background: #047857; }

        /* Printable Document Sheet */
        .printable-sheet {
            max-width: 800px;
            margin: 0 auto 40px;
            background: #ffffff;
            padding: 24px 30px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }

        .pdf-border {
            border: 1.5px solid #000000;
        }
        .pdf-cell-border {
            border: 1px solid #000000;
        }
        .pdf-green-banner {
            background-color: #c4ecc9;
        }
        .pdf-green-header {
            background-color: #c4ecc9;
        }

        @media print {
            .no-print {
                display: none !important;
            }
            body, html {
                background: #ffffff !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .printable-sheet {
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 auto !important;
                width: 100% !important;
                max-width: 100% !important;
            }
            @page {
                size: letter portrait;
                margin: 8mm 10mm;
            }
        }
    </style>
</head>
<body>
@php
    $personnel = is_array($attendance->personnel) ? $attendance->personnel : json_decode($attendance->personnel, true);
    if (!is_array($personnel)) { $personnel = []; }
    
    // Fill up to 12 rows
    while (count($personnel) < 12) {
        $personnel[] = [
            'num' => str_pad(count($personnel) + 1, 2, '0', STR_PAD_LEFT),
            'name' => '',
            'signature' => '',
            'entry_time' => '7:00',
            'exit_time' => '19.00',
        ];
    }

    $squadLeader = is_array($attendance->squad_leader) ? $attendance->squad_leader : json_decode($attendance->squad_leader, true);
    $leader = is_array($squadLeader) && isset($squadLeader[0]) ? $squadLeader[0] : ['num' => '01', 'name' => '', 'signature' => '', 'entry_time' => '7:00', 'exit_time' => '19.00'];

    $safetySupervisor = is_array($attendance->safety_supervisor) ? $attendance->safety_supervisor : json_decode($attendance->safety_supervisor, true);
    $safety = is_array($safetySupervisor) && isset($safetySupervisor[0]) ? $safetySupervisor[0] : ['num' => '01', 'name' => '', 'signature' => '', 'entry_time' => '7:00', 'exit_time' => '19.00'];

    $formattedDate = \Carbon\Carbon::parse($attendance->date)->format('d/m/Y');
@endphp

<!-- Screen Toolbar -->
<header class="no-print screen-toolbar">
    <div style="display: flex; align-items: center; gap: 10px;">
        <a href="{{ route('apt.attendance.index') }}" class="btn-tool btn-tool-dark">
            <i class="fa-solid fa-arrow-left"></i> Prestadores de Servicios
        </a>
        <div style="font-size: 13px;">
            <span style="font-weight: 900; color: #38bdf8; text-transform: uppercase;">Formato Oficial</span> · 
            <strong>{{ $attendance->folio ?: 'GLS-AP-FO-005' }}</strong>
        </div>
    </div>
    <div style="display: flex; gap: 8px;">
        <a href="{{ route('apt.attendance.create') }}" class="btn-tool btn-tool-dark">
            <i class="fa-solid fa-plus"></i> Nuevo
        </a>
        <a href="{{ route('apt.attendance.edit', $attendance->id) }}" class="btn-tool btn-tool-blue">
            <i class="fa-solid fa-pen-to-square"></i> Editar
        </a>
        <button type="button" class="btn-tool btn-tool-green" onclick="window.print()">
            <i class="fa-solid fa-print"></i> Imprimir / Guardar PDF
        </button>
    </div>
</header>

<!-- Printable Sheet 1:1 Replica -->
<div class="printable-sheet">
    <!-- 1. Header Box -->
    <div class="pdf-border" style="margin-bottom: 8px; padding: 6px 12px;">
        <div style="display: grid; grid-template-columns: 110px 1fr 110px; align-items: center; gap: 8px;">
            <!-- Left Logo -->
            <div style="display: flex; align-items: center; justify-content: flex-start;">
                <img src="{{ asset('Proagro.png') }}" alt="Pro-Agro Logo" style="height: 58px; width: 78px; object-fit: contain;">
            </div>

            <!-- Center Titles -->
            <div style="text-align: center;">
                <h1 style="margin: 0; font-size: 16px; font-weight: 900; letter-spacing: -0.01em; color: #000; line-height: 1.2;">
                    PRO-AGROINDUSTRIA S.A. DE C.V.
                </h1>
                <div style="margin: 3px auto; height: 2px; width: 180px; background-color: #dc2626;"></div>
                <h2 style="margin: 0; font-size: 12.5px; font-weight: 900; color: #000; line-height: 1.2;">
                    ALMACEN DE PRODUCTO TERMINADO
                </h2>
                <p style="margin: 2px 0 0; font-size: 10.5px; font-weight: 800; color: #000;">
                    {{ $attendance->format_code ?: 'GLS-AP-FO-005' }}
                </p>
            </div>

            <!-- Right Truck Graphic -->
            <div style="display: flex; align-items: center; justify-content: flex-end;">
                <svg viewBox="0 0 120 70" style="height: 48px; width: 90px;" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M75 18H94C96.5 18 98.8 19.3 100 21.5L108 36.5C108.7 37.7 109 39.1 109 40.5V52C109 53.7 107.7 55 106 55H102C102 49.5 97.5 45 92 45C86.5 45 82 49.5 82 55H75V18Z" fill="#1e293b" stroke="#0f172a" stroke-width="1.5"/>
                    <path d="M78 22H92L99 35H78V22Z" fill="#93c5fd" stroke="#0f172a" stroke-width="1"/>
                    <rect x="10" y="12" width="64" height="43" rx="2" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.5"/>
                    <line x1="10" y1="20" x2="74" y2="20" stroke="#94a3b8" stroke-width="1"/>
                    <line x1="10" y1="28" x2="74" y2="28" stroke="#ef4444" stroke-width="2.5"/>
                    <line x1="10" y1="36" x2="74" y2="36" stroke="#94a3b8" stroke-width="1"/>
                    <circle cx="24" cy="55" r="7" fill="#0f172a"/>
                    <circle cx="24" cy="55" r="3.5" fill="#cbd5e1"/>
                    <circle cx="40" cy="55" r="7" fill="#0f172a"/>
                    <circle cx="40" cy="55" r="3.5" fill="#cbd5e1"/>
                    <circle cx="92" cy="55" r="7" fill="#0f172a"/>
                    <circle cx="92" cy="55" r="3.5" fill="#cbd5e1"/>
                    <rect x="107" y="44" width="3" height="4" rx="1" fill="#facc15"/>
                </svg>
            </div>
        </div>
    </div>

    <!-- 2. Green Pill Banner -->
    <div class="pdf-green-banner pdf-border" style="margin-bottom: 8px; border-radius: 999px; padding: 4px 0; text-align: center;">
        <span style="font-size: 12.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; color: #000;">
            CONTROL DE ASISTENCIAS DE PERSONAL
        </span>
    </div>

    <!-- 3. Prestador de Servicio -->
    <div class="pdf-border" style="margin-bottom: 8px; padding: 4px 10px; background: #fff;">
        <p style="margin: 0; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #000;">
            PRESTADOR DE SERVICIO: <span style="font-weight: 800;">{{ $attendance->service_provider ?: 'OBRAS Y SERVICIOS INDUSTRIALES SAN MARTIN, SA DE CV' }}</span>
        </p>
    </div>

    <!-- 4. Turno / Area / Fecha Grid -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 8px;">
        <div class="pdf-border" style="text-align: center; overflow: hidden;">
            <div class="pdf-green-header pdf-cell-border" style="border-top:0; border-left:0; border-right:0; padding: 2px 0; font-size: 9.5px; font-weight: 900; text-transform: uppercase; color: #000;">
                TURNO
            </div>
            <div style="padding: 3px 0; font-size: 10.5px; font-weight: 900; color: #000;">
                {{ $attendance->shift ?: '1A' }}
            </div>
        </div>

        <div class="pdf-border" style="text-align: center; overflow: hidden;">
            <div class="pdf-green-header pdf-cell-border" style="border-top:0; border-left:0; border-right:0; padding: 2px 0; font-size: 9.5px; font-weight: 900; text-transform: uppercase; color: #000;">
                AREA DE TRABAJO
            </div>
            <div style="padding: 3px 0; font-size: 10.5px; font-weight: 900; color: #000;">
                {{ $attendance->work_area ?: 'APT 2' }}
            </div>
        </div>

        <div class="pdf-border" style="text-align: center; overflow: hidden;">
            <div class="pdf-green-header pdf-cell-border" style="border-top:0; border-left:0; border-right:0; padding: 2px 0; font-size: 9.5px; font-weight: 900; text-transform: uppercase; color: #000;">
                FECHA:
            </div>
            <div style="padding: 3px 0; font-size: 10.5px; font-weight: 900; color: #000;">
                {{ $formattedDate }}
            </div>
        </div>
    </div>

    <!-- 5. Actividad que se va a realizar / Linea de Carga -->
    <div class="pdf-border" style="margin-bottom: 8px; overflow: hidden;">
        <div style="display: grid; grid-template-columns: 1fr 180px; text-align: center; font-size: 9px; font-weight: 900; text-transform: uppercase; color: #000;" class="pdf-green-header">
            <div class="pdf-cell-border" style="border-top:0; border-left:0; border-bottom:0; padding: 2px 4px;">
                ACTIVIDAD QUE SE VA REALIZAR:
            </div>
            <div style="padding: 2px 4px;">
                LINEA DE CARGA
            </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 180px; text-align: center; font-size: 9.5px; font-weight: 900; text-transform: uppercase; color: #000; border-top: 1px solid #000; background: #fff;">
            <div style="padding: 3px 8px; border-right: 1px solid #000;">
                {{ $attendance->activity ?: 'ENVASADO DE UREA EN SACO DE 25 Y ESTIBADO CAMION' }}
            </div>
            <div style="padding: 3px 8px;">
                {{ $attendance->loading_line ?: 'GLS-APT-ENV (   )' }}
            </div>
        </div>
    </div>

    <!-- 6. Personal que Realiza la Actividad -->
    <div class="pdf-border" style="margin-bottom: 8px; overflow: hidden;">
        <div class="pdf-green-header pdf-cell-border" style="border-top:0; border-left:0; border-right:0; text-align: center; padding: 2px 0; font-size: 9.5px; font-weight: 900; text-transform: uppercase; color: #000;">
            PERSONAL QUE REALIZA LA ACTIVIDAD:
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px; text-align: left;">
            <thead>
                <tr style="text-align: center; font-weight: 900; text-transform: uppercase; color: #000; border-bottom: 1px solid #000;">
                    <th class="pdf-cell-border" style="border-top:0; border-left:0; width: 45px; padding: 2px 0;">Num.</th>
                    <th class="pdf-cell-border" style="border-top:0; padding: 2px 8px; text-align: left;">NOMBRE</th>
                    <th class="pdf-cell-border" style="border-top:0; width: 130px; padding: 2px 0;">FIRMA</th>
                    <th class="pdf-cell-border" style="border-top:0; width: 60px; padding: 2px 0;">H.E</th>
                    <th class="pdf-cell-border" style="border-top:0; border-right:0; width: 60px; padding: 2px 0;">H.S</th>
                </tr>
            </thead>
            <tbody>
                @foreach($personnel as $idx => $row)
                    <tr style="border-bottom: 1px solid #000; height: 19px;">
                        <td class="pdf-cell-border" style="border-left:0; text-align: center; font-weight: 700; padding: 1px 0;">
                            {{ $row['num'] ?? str_pad($idx + 1, 2, '0', STR_PAD_LEFT) }}
                        </td>
                        <td class="pdf-cell-border" style="padding: 1px 8px; font-weight: 900; text-transform: uppercase;">
                            {{ $row['name'] ?? '' }}
                        </td>
                        <td class="pdf-cell-border" style="text-align: center; font-size: 8px; color: #475569; padding: 1px 0;">
                            {{ $row['signature'] ?? '' }}
                        </td>
                        <td class="pdf-cell-border" style="text-align: center; font-weight: 900; padding: 1px 0;">
                            {{ $row['entry_time'] ?? '7:00' }}
                        </td>
                        <td class="pdf-cell-border" style="border-right:0; text-align: center; font-weight: 900; padding: 1px 0;">
                            {{ $row['exit_time'] ?? '19.00' }}
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <!-- 7. Líder de Cuadrilla -->
    <div class="pdf-border" style="margin-bottom: 8px; overflow: hidden;">
        <div class="pdf-green-header pdf-cell-border" style="border-top:0; border-left:0; border-right:0; text-align: center; padding: 2px 0; font-size: 9.5px; font-weight: 900; text-transform: uppercase; color: #000;">
            LIDER DE CUADRILLA RESPONSABLE
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
            <thead>
                <tr style="text-align: center; font-weight: 900; text-transform: uppercase; color: #000; border-bottom: 1px solid #000;">
                    <th class="pdf-cell-border" style="border-top:0; border-left:0; width: 45px; padding: 2px 0;">Num.</th>
                    <th class="pdf-cell-border" style="border-top:0; padding: 2px 8px; text-align: left;">NOMBRE</th>
                    <th class="pdf-cell-border" style="border-top:0; width: 130px; padding: 2px 0;">FIRMA</th>
                    <th class="pdf-cell-border" style="border-top:0; width: 60px; padding: 2px 0;">H.E</th>
                    <th class="pdf-cell-border" style="border-top:0; border-right:0; width: 60px; padding: 2px 0;">H.S</th>
                </tr>
            </thead>
            <tbody>
                <tr style="height: 19px;">
                    <td class="pdf-cell-border" style="border-left:0; text-align: center; font-weight: 700; padding: 1px 0;">
                        {{ $leader['num'] ?? '01' }}
                    </td>
                    <td class="pdf-cell-border" style="padding: 1px 8px; font-weight: 900; text-transform: uppercase;">
                        {{ $leader['name'] ?? '' }}
                    </td>
                    <td class="pdf-cell-border" style="text-align: center; font-size: 8px; color: #475569; padding: 1px 0;">
                        {{ $leader['signature'] ?? '' }}
                    </td>
                    <td class="pdf-cell-border" style="text-align: center; font-weight: 900; padding: 1px 0;">
                        {{ $leader['entry_time'] ?? '7:00' }}
                    </td>
                    <td class="pdf-cell-border" style="border-right:0; text-align: center; font-weight: 900; padding: 1px 0;">
                        {{ $leader['exit_time'] ?? '19.00' }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- 8. Supervisor Responsable de Seguridad -->
    <div class="pdf-border" style="margin-bottom: 8px; overflow: hidden;">
        <div class="pdf-green-header pdf-cell-border" style="border-top:0; border-left:0; border-right:0; text-align: center; padding: 2px 0; font-size: 9.5px; font-weight: 900; text-transform: uppercase; color: #000;">
            SUPERVISOR RESPONSABLE DE SEGURIDAD DEL PRESTADOR DE SERVICIO
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
            <thead>
                <tr style="text-align: center; font-weight: 900; text-transform: uppercase; color: #000; border-bottom: 1px solid #000;">
                    <th class="pdf-cell-border" style="border-top:0; border-left:0; width: 45px; padding: 2px 0;">Num.</th>
                    <th class="pdf-cell-border" style="border-top:0; padding: 2px 8px; text-align: left;">NOMBRE</th>
                    <th class="pdf-cell-border" style="border-top:0; width: 130px; padding: 2px 0;">FIRMA</th>
                    <th class="pdf-cell-border" style="border-top:0; width: 60px; padding: 2px 0;">H.E</th>
                    <th class="pdf-cell-border" style="border-top:0; border-right:0; width: 60px; padding: 2px 0;">H.S</th>
                </tr>
            </thead>
            <tbody>
                <tr style="height: 19px;">
                    <td class="pdf-cell-border" style="border-left:0; text-align: center; font-weight: 700; padding: 1px 0;">
                        {{ $safety['num'] ?? '01' }}
                    </td>
                    <td class="pdf-cell-border" style="padding: 1px 8px; font-weight: 900; text-transform: uppercase;">
                        {{ $safety['name'] ?? '' }}
                    </td>
                    <td class="pdf-cell-border" style="text-align: center; font-size: 8px; color: #475569; padding: 1px 0;">
                        {{ $safety['signature'] ?? '' }}
                    </td>
                    <td class="pdf-cell-border" style="text-align: center; font-weight: 900; padding: 1px 0;">
                        {{ $safety['entry_time'] ?? '7:00' }}
                    </td>
                    <td class="pdf-cell-border" style="border-right:0; text-align: center; font-weight: 900; padding: 1px 0;">
                        {{ $safety['exit_time'] ?? '19.00' }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- 9. Observaciones -->
    <div class="pdf-border" style="margin-bottom: 24px; padding: 6px 10px; min-height: 48px;">
        <p style="margin: 0 0 4px; font-size: 9.5px; font-weight: 900; text-transform: uppercase; color: #000;">
            OBSERVACIONES:
        </p>
        <p style="margin: 0; font-size: 9px; font-weight: 500; color: #000; padding-left: 6px; white-space: pre-wrap;">{{ $attendance->observations }}</p>
    </div>

    <!-- 10. Footer Firma -->
    <div style="text-align: center; margin-top: 20px; padding-top: 8px;">
        <div style="margin: 0 auto 4px; width: 220px; border-top: 1px solid #000;"></div>
        <p style="margin: 0; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #000;">
            {{ $attendance->supervision_name ?: 'PRO-AGROINDUSTRIA, S.A. DE C.V.' }}
        </p>
        <p style="margin: 2px 0 0; font-size: 9.5px; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; color: #000;">
            SUPERVISIÓN
        </p>
    </div>
</div>
</body>
</html>
