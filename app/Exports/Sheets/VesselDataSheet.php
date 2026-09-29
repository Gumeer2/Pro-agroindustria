<?php

namespace App\Exports\Sheets;

use App\Models\LoadingOrder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use App\Helpers\OperationalTimeHelper;

class VesselDataSheet implements FromQuery, WithHeadings, WithMapping, WithTitle, ShouldAutoSize
{
    protected $vesselId;

    public function __construct($vesselId)
    {
        $this->vesselId = $vesselId;
    }

    public function query()
    {
        return LoadingOrder::query()
            ->join('weight_tickets', 'loading_orders.id', '=', 'weight_tickets.loading_order_id')
            ->leftJoin('vessel_operator_trips', 'loading_orders.vessel_operator_trip_id', '=', 'vessel_operator_trips.id')
            ->where('loading_orders.vessel_id', $this->vesselId)
            ->where(function ($q) {
                $q->where('loading_orders.status', 'completed')
                    ->orWhere('loading_orders.operation_type', 'burreo');
            })
            ->select('loading_orders.*', 'weight_tickets.net_weight', 'weight_tickets.weigh_out_at', 'weight_tickets.ticket_number', 'vessel_operator_trips.hold_number', 'vessel_operator_trips.start_time')
            ->orderBy('weight_tickets.weigh_out_at', 'asc');
    }

    public function headings(): array
    {
        return [
            'ID Viaje',
            'Ticket',
            'Escaneo Muelle',
            'Escaneo Almacén',
            'Operador',
            ' Económico',
            'Tractor Placa',
            'Remolque Placa',
            'Producto',
            'Almacén',
            'Cubículo',
            'Bodega',
            'Peso Neto (MT)',
            'Tipo Operación'
        ];
    }

    public function map($order): array
    {
        return [
            $order->folio ?? $order->id,
            $order->ticket_number ?? '---',
            $order->start_time ?? '---',
            $order->weigh_out_at,
            $order->operator_name,
            $order->economic_number ?? 'S/N',
            $order->tractor_plate ?? '---',
            $order->trailer_plate ?? '---',
            $order->product_name ?? 'N/A',
            $order->reference ?? 'N/A',
            $order->cubicle ?? 'N/A',
            $order->hold_number ?? '---',
            $order->net_weight / 1000,
            ucfirst($order->operation_type ?? 'Báscula')
        ];
    }

    public function title(): string
    {
        return 'Detalle de Vueltas';
    }
}
