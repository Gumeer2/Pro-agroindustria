<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reporte de Incidencias y Relevancias - Proagroindustria</title>
    <link rel="icon" type="image/png" href="{{ asset('Proagro.png') }}">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --sky-700: #0369a1;
            --sky-800: #075985;
            --slate-100: #f1f5f9;
            --slate-200: #e2e8f0;
            --slate-700: #334155;
            --slate-800: #1e293b;
            --slate-900: #0f172a;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background: #f8fafc;
            color: var(--slate-900);
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .toolbar {
            position: sticky;
            top: 0;
            z-index: 100;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 12px 24px;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(8px);
            color: #fff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .toolbar-info {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            font-weight: 700;
        }
        .toolbar-actions {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .btn-action {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 800;
            cursor: pointer;
            border: 1px solid transparent;
            transition: all 0.2s;
            text-decoration: none;
        }
        .btn-print {
            background: #0284c7;
            color: #fff;
        }
        .btn-print:hover {
            background: #0369a1;
        }
        .btn-close {
            background: rgba(255,255,255,0.12);
            color: #fff;
            border-color: rgba(255,255,255,0.25);
        }
        .btn-close:hover {
            background: rgba(255,255,255,0.2);
        }

        .paper {
            width: 100%;
            max-width: 1200px;
            margin: 24px auto;
            background: #ffffff;
            padding: 32px 40px;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
            border: 1px solid var(--slate-200);
        }

        .report-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid var(--sky-700);
            padding-bottom: 18px;
            margin-bottom: 20px;
        }
        .header-brand {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .header-brand img {
            width: 58px;
            height: 58px;
            object-fit: contain;
            border-radius: 12px;
            border: 1px solid var(--slate-200);
            padding: 4px;
        }
        .header-brand h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 900;
            color: var(--sky-700);
            letter-spacing: -0.01em;
        }
        .header-brand p {
            margin: 3px 0 0;
            font-size: 12px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }
        .header-meta {
            text-align: right;
        }
        .header-meta .doc-badge {
            display: inline-block;
            background: var(--sky-700);
            color: #fff;
            padding: 5px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            margin-bottom: 4px;
        }
        .header-meta p {
            margin: 2px 0 0;
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
            background: var(--slate-100);
            padding: 14px 18px;
            border-radius: 10px;
            border: 1px solid var(--slate-200);
        }
        .summary-item {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .summary-label {
            font-size: 10px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .summary-value {
            font-size: 13px;
            font-weight: 800;
            color: var(--slate-800);
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-bottom: 32px;
        }
        .data-table th {
            background: var(--sky-700);
            color: #ffffff;
            padding: 10px 8px;
            text-align: left;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            border: 1px solid var(--sky-800);
            white-space: nowrap;
        }
        .data-table td {
            padding: 9px 8px;
            border: 1px solid var(--slate-200);
            color: var(--slate-800);
            vertical-align: middle;
        }
        .data-table tr:nth-child(even) td {
            background: #f8fafc;
        }
        .type-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
        }
        .type-incidencia {
            background: #fee2e2;
            color: #991b1b;
        }
        .type-relevancia {
            background: #e0f2fe;
            color: #0369a1;
        }
        .thumb-preview {
            width: 46px;
            height: 34px;
            object-fit: cover;
            border-radius: 4px;
            border: 1px solid var(--slate-300);
            display: block;
        }
        .empty-row {
            text-align: center;
            padding: 32px !important;
            color: #64748b;
            font-weight: 700;
            font-size: 13px;
        }

        .signatures-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 60px;
            margin-top: 40px;
            page-break-inside: avoid;
        }
        .sig-box {
            text-align: center;
            border-top: 1px solid var(--slate-700);
            padding-top: 10px;
        }
        .sig-box p {
            margin: 2px 0 0;
            font-size: 12px;
            font-weight: 700;
            color: var(--slate-800);
        }
        .sig-box span {
            font-size: 10px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
        }

        @media print {
            .no-print {
                display: none !important;
            }
            body {
                background: #ffffff;
            }
            .paper {
                max-width: 100%;
                margin: 0;
                padding: 0;
                border: none;
                box-shadow: none;
            }
            @page {
                size: landscape;
                margin: 10mm 12mm;
            }
        }
    </style>
</head>
@php
    $effectiveFrom = null;
    $effectiveTo = null;

    if (!empty($activityDate)) {
        $effectiveFrom = \Carbon\Carbon::parse($activityDate)->format('d/m/Y');
        $effectiveTo = $effectiveFrom;
    } elseif ($activities->isNotEmpty()) {
        $minOccurred = $activities->min('occurred_at') ?: $activities->min('created_at');
        $maxOccurred = $activities->max('occurred_at') ?: $activities->max('created_at');
        if ($minOccurred) $effectiveFrom = \Carbon\Carbon::parse($minOccurred)->format('d/m/Y');
        if ($maxOccurred) $effectiveTo = \Carbon\Carbon::parse($maxOccurred)->format('d/m/Y');
    }

    $periodText = ($effectiveFrom && $effectiveTo && $effectiveFrom !== $effectiveTo)
        ? "Del {$effectiveFrom} al {$effectiveTo}"
        : ($effectiveFrom ? "{$effectiveFrom}" : 'Historial completo del lote');
@endphp

<body>
    <div class="toolbar no-print">
        <div class="toolbar-info">
            <span>📄 Reporte de Historial de Incidencias / Relevancias</span>
        </div>
        <div class="toolbar-actions">
            <button type="button" class="btn-action btn-print" onclick="window.print()">
                🖨 Imprimir / Guardar PDF
            </button>
            <button type="button" class="btn-action btn-close" onclick="window.close()">
                ✕ Cerrar pestaña
            </button>
        </div>
    </div>

    <div class="paper">
        <header class="report-header">
            <div class="header-brand">
                <img src="{{ asset('Proagro.png') }}" alt="Proagroindustria">
                <div>
                    <h1>PROAGROINDUSTRIA</h1>
                    <p>Módulo Operativo · APT | Control de Producción</p>
                </div>
            </div>
            <div class="header-meta">
                <span class="doc-badge">Historial de Turno</span>
                <p><strong>Período emitido:</strong> <span style="color: var(--sky-700); font-weight: 800;">{{ $periodText }}</span></p>
                <p><strong>Fecha de emisión:</strong> {{ date('d/m/Y H:i:s') }}</p>
                <p><strong>Generado por:</strong> {{ auth()->user()->name ?? 'Usuario' }}</p>
            </div>
        </header>

        <section class="summary-grid">
            <div class="summary-item">
                <span class="summary-label">Lote Asignado</span>
                <span class="summary-value" style="color: var(--sky-700);">
                    {{ optional(optional($registration)->lot)->folio ?: 'Sin lote específico' }}
                </span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Filtro de Tipo</span>
                <span class="summary-value">
                    {{ $activityType === 'incidencia' ? 'Solo Incidencias' : ($activityType === 'relevancia' ? 'Solo Relevancias' : 'Todas') }}
                </span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Período del Reporte</span>
                <span class="summary-value" style="color: var(--sky-700);">
                    {{ $periodText }}
                </span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Total de Registros</span>
                <span class="summary-value">{{ count($activities) }} actividades</span>
            </div>
        </section>

        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 25px; text-align: center;">#</th>
                    <th style="width: 75px;">Fecha</th>
                    <th style="width: 65px;">Hora</th>
                    <th>No. de lote</th>
                    <th>Disposición</th>
                    <th>Ubicación</th>
                    <th>Producto</th>
                    <th>Tipo</th>
                    <th style="width: 28%;">Descripción</th>
                    <th>Usuario</th>
                    <th style="width: 60px; text-align: center;">Evidencia</th>
                </tr>
            </thead>
            <tbody>
                @forelse($activities as $index => $activity)
                    @php
                        $lot = optional($activity->shiftStart)->lot ?: optional($registration)->lot;
                    @endphp
                    <tr>
                        <td style="text-align: center; font-weight: 700; color: #64748b;">{{ $index + 1 }}</td>
                        <td>{{ $activity->occurred_at ? $activity->occurred_at->format('d/m/Y') : '—' }}</td>
                        <td>{{ $activity->occurred_at ? $activity->occurred_at->format('H:i:s') : '—' }}</td>
                        <td style="font-weight: 700; white-space: nowrap;">{{ optional($lot)->folio ?: '—' }}</td>
                        <td>{{ optional($lot)->warehouse ?: '—' }}</td>
                        <td>{{ $activity->location ?: (optional($lot)->cubicle ?: 'Automático') }}</td>
                        @php
                            $reportFolio = (string) optional($lot)->folio;
                            $reportProduct = preg_match('/-UI(?:[-(]|$)/i', $reportFolio)
                                ? 'UREA INDUSTRIAL'
                                : (preg_match('/-UA(?:[-(]|$)/i', $reportFolio)
                                    ? 'UREA AGRICOLA'
                                    : (optional($lot)->plant_origin ?: 'Automático'));
                        @endphp
                        <td>{{ $reportProduct }}</td>
                        <td>
                            <span class="type-badge {{ $activity->type === 'incidencia' ? 'type-incidencia' : 'type-relevancia' }}">
                                {{ ucfirst($activity->type) }}
                            </span>
                        </td>
                        <td>{{ $activity->description }}</td>
                        <td>{{ optional($activity->user)->name ?: '—' }}</td>
                        <td style="text-align: center;">
                            @if($activity->evidence_path)
                                <img src="{{ $activity->evidenceUrl() }}" alt="Evidencia" class="thumb-preview">
                            @else
                                <span style="color: #94a3b8;">—</span>
                            @endif
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="11" class="empty-row">
                            No se encontraron registros de incidencias o relevancias para los filtros seleccionados.
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <footer class="signatures-section">
            <div class="sig-box">
                <p>{{ auth()->user()->name ?? 'Operador' }}</p>
                <span>Operador / Responsable de Turno</span>
            </div>
            <div class="sig-box">
                <p>Jefe de Almacén</p>
                <span>Supervisión y Control de Calidad APT</span>
            </div>
        </footer>
    </div>
</body>
</html>
