<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reporte de Asignaciones de Lotes</title>
    <link rel="icon" type="image/png" href="{{ asset('Proagro.png') }}">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800,900&display=swap" rel="stylesheet">
    <style>
        :root { --ink: #0f172a; --muted: #64748b; --line: #e2e8f0; --sky: #0369a1; --sky-soft: #eff6ff; --green: #15803d; --green-soft: #f0fdf4; --amber: #b45309; --amber-soft: #fffbeb; }
        * { box-sizing: border-box; }
        body { margin: 0; min-height: 100vh; background: #f8fafc; color: var(--ink); font-family: Inter, system-ui, sans-serif; }
        .page { max-width: 1240px; margin: 0 auto; padding: 34px 24px 56px; }
        .back { display: inline-flex; align-items: center; gap: 9px; color: #334155; background: #fff; border: 1px solid var(--line); border-radius: 11px; padding: 10px 16px; font-size: 13px; font-weight: 800; text-decoration: none; box-shadow: 0 2px 5px rgba(15,23,42,.04); }
        .back:hover { color: var(--sky); border-color: #bae6fd; background: var(--sky-soft); }
        .hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin: 28px 0 24px; }
        .eyebrow { margin: 0 0 7px; color: var(--sky); font-size: 11px; font-weight: 900; letter-spacing: .16em; text-transform: uppercase; }
        h1 { margin: 0; font-size: clamp(26px, 4vw, 38px); letter-spacing: -.03em; }
        .hero p { max-width: 650px; margin: 10px 0 0; color: var(--muted); font-size: 14px; }
        .filters { display: flex; flex-wrap: wrap; align-items: end; gap: 12px; padding: 18px; margin-bottom: 18px; background: #fff; border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 8px 25px rgba(15,23,42,.05); }
        .field { display: grid; gap: 6px; min-width: 210px; flex: 1; }
        .field span { color: #475569; font-size: 11px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
        input, select { width: 100%; border: 1px solid #cbd5e1; border-radius: 9px; padding: 10px 12px; color: #334155; background: #fff; outline: none; }
        input:focus, select:focus { border-color: #0ea5e9; box-shadow: 0 0 0 3px rgba(14,165,233,.12); }
        .button { border: 1px solid var(--sky); border-radius: 9px; padding: 10px 16px; background: var(--sky); color: #fff; font-weight: 800; cursor: pointer; }
        .button:hover { background: #075985; }
        .clear { align-self: center; color: var(--muted); font-size: 13px; font-weight: 700; text-decoration: none; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
        .summary-card { display: flex; align-items: center; gap: 13px; padding: 17px; background: #fff; border: 1px solid var(--line); border-radius: 14px; }
        .summary-icon { display: grid; width: 40px; height: 40px; place-items: center; border-radius: 11px; background: var(--sky-soft); color: #2563eb; }
        .summary-card:nth-child(3) .summary-icon { background: var(--green-soft); color: var(--green); }
        .summary-card:nth-child(4) .summary-icon { background: var(--amber-soft); color: var(--amber); }
        .summary-value { display: block; font-size: 22px; font-weight: 900; }
        .summary-label { color: var(--muted); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; }
        .table-wrap { overflow: hidden; background: #fff; border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 12px 30px rgba(15,23,42,.06); }
        .table-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 20px; border-bottom: 1px solid var(--line); }
        .table-head h2 { margin: 0; font-size: 16px; }
        .table-head span { color: var(--muted); font-size: 12px; font-weight: 700; }
        .scroll { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 900px; }
        th { padding: 12px 16px; background: #f8fafc; color: #64748b; font-size: 10px; font-weight: 900; letter-spacing: .08em; text-align: left; text-transform: uppercase; white-space: nowrap; }
        td { padding: 15px 16px; border-top: 1px solid #f1f5f9; color: #334155; font-size: 13px; vertical-align: middle; }
        tr:hover td { background: #f8fbff; }
        .user { color: #0f172a; font-weight: 800; }
        .lot { color: var(--sky); font-weight: 900; }
        .lot-select { min-width: 245px; color: var(--sky); font-weight: 800; }
        .sub { display: block; margin-top: 3px; color: var(--muted); font-size: 11px; }
        .badge { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 6px 10px; font-size: 10px; font-weight: 900; text-transform: uppercase; }
        .badge.open { color: #0369a1; background: #e0f2fe; }
        .badge.closed { color: var(--green); background: #dcfce7; }
        .empty { padding: 48px 20px; color: var(--muted); text-align: center; }
        @media (max-width: 800px) { .hero { align-items: flex-start; flex-direction: column; } .summary { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 520px) { .page { padding: 22px 14px 40px; } .summary { grid-template-columns: 1fr 1fr; gap: 8px; } .summary-card { padding: 12px; } .summary-icon { width: 34px; height: 34px; } .summary-value { font-size: 19px; } .filters { display: grid; } .field { min-width: 0; } }
    </style>
</head>
<body>
    <main class="page">
        <a class="back" href="{{ route('apt.production.hub') }}"><i class="fa-solid fa-arrow-left"></i> Volver a Gestión de la producción</a>

        <header class="hero">
            <div>
                <p class="eyebrow">Módulo operativo · APT</p>
                <h1>Reporte de Asignaciones de Lotes</h1>
                <p>Consulta qué lotes tiene o tuvo asignados cada usuario, cuáles siguen abiertos y cuándo fueron cerrados.</p>
            </div>
        </header>

        <form class="filters" method="GET" action="{{ route('apt.management.assignments.report') }}">
            <label class="field"><span>Buscar usuario, lote o turno</span><input type="search" name="search" value="{{ $search }}" placeholder="Ej. nombre o folio"></label>
            <label class="field"><span>Estado</span><select name="status"><option value="all" @selected($status === 'all')>Todos</option><option value="open" @selected($status === 'open')>Abiertos</option><option value="closed" @selected($status === 'closed')>Cerrados</option></select></label>
            <button class="button" type="submit"><i class="fa-solid fa-filter"></i> Consultar</button>
            <a class="clear" href="{{ route('apt.management.assignments.report') }}">Limpiar</a>
        </form>

        <section class="summary" aria-label="Resumen de asignaciones">
            <div class="summary-card"><div class="summary-icon"><i class="fa-solid fa-users"></i></div><div><span class="summary-value">{{ $summary['users'] }}</span><span class="summary-label">Usuarios</span></div></div>
            <div class="summary-card"><div class="summary-icon"><i class="fa-solid fa-boxes-stacked"></i></div><div><span class="summary-value">{{ $summary['total'] }}</span><span class="summary-label">Asignaciones</span></div></div>
            <div class="summary-card"><div class="summary-icon"><i class="fa-solid fa-lock-open"></i></div><div><span class="summary-value">{{ $summary['open'] }}</span><span class="summary-label">Lotes abiertos</span></div></div>
            <div class="summary-card"><div class="summary-icon"><i class="fa-solid fa-circle-check"></i></div><div><span class="summary-value">{{ $summary['closed'] }}</span><span class="summary-label">Lotes cerrados</span></div></div>
        </section>

        <section class="table-wrap">
            <div class="table-head"><h2>Detalle por usuario</h2><span>{{ $summary['total'] }} asignaciones encontradas</span></div>
            <div class="scroll">
                <table>
                    <thead><tr><th>Usuario</th><th>Lote</th><th>Turno</th><th>Fecha de asignación</th><th>Estado</th><th>Cierre</th><th>Cerrado por</th></tr></thead>
                    <tbody>
                    @forelse($userAssignments as $userAssignment)
                        @php $firstAssignment = $userAssignment['lots']->first(); @endphp
                        <tr data-user-row>
                            <td class="user">{{ $userAssignment['user_name'] }}</td>
                            <td>
                                <select class="lot-select" data-assignment-select aria-label="Lotes asignados a {{ $userAssignment['user_name'] }}">
                                    @foreach($userAssignment['lots'] as $assignment)
                                        <option value="{{ $loop->index }}"
                                            data-folio="{{ $assignment->folio }}"
                                            data-warehouse="{{ $assignment->warehouse ?: 'Sin disposición' }}"
                                            data-shift="{{ $assignment->shift }}"
                                            data-started-date="{{ $assignment->started_at ? \Carbon\Carbon::parse($assignment->started_at)->format('d/m/Y') : '—' }}"
                                            data-started-time="{{ $assignment->started_at ? \Carbon\Carbon::parse($assignment->started_at)->format('H:i:s') : '—' }}"
                                            data-status="{{ $assignment->status }}"
                                            data-closed-date="{{ $assignment->closed_at ? \Carbon\Carbon::parse($assignment->closed_at)->format('d/m/Y') : '—' }}"
                                            data-closed-time="{{ $assignment->closed_at ? \Carbon\Carbon::parse($assignment->closed_at)->format('H:i:s') : 'Pendiente' }}"
                                            data-closed-by="{{ $assignment->closed_by_name ?: '—' }}">
                                            {{ $assignment->folio }}{{ $assignment->status === 'closed' ? ' · Cerrado' : ' · Abierto' }}
                                        </option>
                                    @endforeach
                                </select>
                                <span class="sub" data-assignment-warehouse>{{ $firstAssignment->warehouse ?: 'Sin disposición' }}</span>
                            </td>
                            <td data-assignment-shift>{{ $firstAssignment->shift }}</td>
                            <td><span data-assignment-started-date>{{ $firstAssignment->started_at ? \Carbon\Carbon::parse($firstAssignment->started_at)->format('d/m/Y') : '—' }}</span><span class="sub" data-assignment-started-time>{{ $firstAssignment->started_at ? \Carbon\Carbon::parse($firstAssignment->started_at)->format('H:i:s') : '—' }}</span></td>
                            <td><span class="badge {{ $firstAssignment->status === 'closed' ? 'closed' : 'open' }}" data-assignment-status><i class="fa-solid {{ $firstAssignment->status === 'closed' ? 'fa-check' : 'fa-clock' }}"></i>{{ $firstAssignment->status === 'closed' ? 'Cerrado' : 'Abierto' }}</span></td>
                            <td><span data-assignment-closed-date>{{ $firstAssignment->closed_at ? \Carbon\Carbon::parse($firstAssignment->closed_at)->format('d/m/Y') : '—' }}</span><span class="sub" data-assignment-closed-time>{{ $firstAssignment->closed_at ? \Carbon\Carbon::parse($firstAssignment->closed_at)->format('H:i:s') : 'Pendiente' }}</span></td>
                            <td data-assignment-closed-by>{{ $firstAssignment->closed_by_name ?: '—' }}</td>
                        </tr>
                    @empty
                        <tr><td class="empty" colspan="7">No hay asignaciones que coincidan con los filtros.</td></tr>
                    @endforelse
                    </tbody>
                </table>
            </div>
        </section>
    </main>
    <script>
        document.querySelectorAll('[data-user-row]').forEach((row) => {
            const select = row.querySelector('[data-assignment-select]');
            const update = () => {
                const option = select.options[select.selectedIndex];
                row.querySelector('[data-assignment-warehouse]').textContent = option.dataset.warehouse || 'Sin disposición';
                row.querySelector('[data-assignment-shift]').textContent = option.dataset.shift || '—';
                row.querySelector('[data-assignment-started-date]').textContent = option.dataset.startedDate || '—';
                row.querySelector('[data-assignment-started-time]').textContent = option.dataset.startedTime || '—';
                row.querySelector('[data-assignment-closed-date]').textContent = option.dataset.closedDate || '—';
                row.querySelector('[data-assignment-closed-time]').textContent = option.dataset.closedTime || 'Pendiente';
                row.querySelector('[data-assignment-closed-by]').textContent = option.dataset.closedBy || '—';
                const status = row.querySelector('[data-assignment-status]');
                const closed = option.dataset.status === 'closed';
                status.className = `badge ${closed ? 'closed' : 'open'}`;
                status.innerHTML = `<i class="fa-solid ${closed ? 'fa-check' : 'fa-clock'}"></i>${closed ? 'Cerrado' : 'Abierto'}`;
            };
            select.addEventListener('change', update);
        });
    </script>
</body>
</html>
