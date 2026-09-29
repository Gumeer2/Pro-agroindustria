<?php

namespace App\Exports\Sheets;

use App\Models\LoadingOrder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Illuminate\Support\Facades\DB;
use App\Helpers\OperationalTimeHelper;
use Carbon\Carbon;

class DashboardDataSheet implements FromQuery, WithHeadings, WithMapping, WithTitle, ShouldAutoSize
{
    protected $filters;

    public function __construct($filters)
    {
        $this->filters = $filters;
    }

    public function query()
    {
        $vesselId = $this->filters['vessel_id'] ?? null;
        $dateStart = $this->filters['start_date'] ?? null;
        $dateEnd = $this->filters['end_date'] ?? null;
        $specificDate = $this->filters['specific_date'] ?? null;
        $warehouse = $this->filters['warehouse'] ?? null;
        $operator = $this->filters['operator'] ?? null;
        $operationType = $this->filters['operation_type'] ?? 'all';

        $query = LoadingOrder::query()
            ->join('weight_tickets', 'loading_orders.id', '=', 'weight_tickets.loading_order_id')
            ->leftJoin('vessel_operator_trips', 'loading_orders.vessel_operator_trip_id', '=', 'vessel_operator_trips.id')
            ->select('loading_orders.*', 'weight_tickets.net_weight', 'weight_tickets.weigh_out_at', 'weight_tickets.ticket_number', 'vessel_operator_trips.hold_number', 'vessel_operator_trips.start_time');

        if ($vesselId) {
            $query->where('loading_orders.vessel_id', $vesselId);
        }

        if ($dateStart && $dateEnd) {
            $range = OperationalTimeHelper::getStandardRange($dateStart, $dateEnd);
            $query->whereBetween('weight_tickets.weigh_out_at', $range);
        }
        elseif ($specificDate) {
            $range = OperationalTimeHelper::getStandardRange($specificDate);
            $query->whereBetween('weight_tickets.weigh_out_at', $range);
        }

        if ($warehouse) {
            $query->where('loading_orders.warehouse', $warehouse);
        }

        if ($operator) {
            $query->where('loading_orders.operator_name', $operator);
        }

        // Apply same "Completed/Burreo" logic as Dashboard to match visuals
        $query->where(function ($q) {
            $q->where('loading_orders.status', 'completed')
                ->orWhere('loading_orders.operation_type', 'burreo');
        });

        if ($operationType === 'scale') {
            $query->where(function ($q) {
                $q->where('loading_orders.operation_type', 'scale')
                    ->orWhereNull('loading_orders.operation_type');
            });
        }
        elseif ($operationType === 'burreo') {
            $query->where('loading_orders.operation_type', 'burreo');
        }

        return $query->orderByDesc('weight_tickets.weigh_out_at');

    }

    public function headings(): array
    {
        return [
            'ID Viaje',
            'Ticket',
            'Escaneo Muelle',
            'Escaneo Almacén',
            'Operador',
            'Económico',
            'Placas',
            'Producto',
            'Almacén',
            'Cubículo',
            'Bodega',
            'Peso Neto (TM)',
            'Tipo Op.',
            'Estatus'
        ];
    }

    public function map($order): array
    {
        return [
            $order->id,
            $order->ticket_number ?? '---',
            $order->start_time ?? '---',
            $order->weigh_out_at,
            $order->operator_name,
            $order->economic_number ?? $order->unit_number ?? 'S/N',
            $order->tractor_plate ?? '---',
            $order->product_name,
            $order->warehouse,
            $order->cubicle,
            $order->hold_number ?? '---',
            $order->net_weight / 1000,
            ucfirst($order->operation_type ?? 'Báscula'),
            ucfirst($order->status)
        ];
    }

    public function title(): string
    {
        return 'Data Cruda (Source)';
    }
}
