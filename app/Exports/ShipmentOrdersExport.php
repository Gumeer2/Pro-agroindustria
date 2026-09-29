<?php

namespace App\Exports;

use App\Models\ShipmentOrder;
use App\Models\Product;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use Carbon\Carbon;
use App\Helpers\OperationalTimeHelper;
use App\Models\ShipmentOrigin;
use App\Models\Lot;
use Illuminate\Support\Facades\DB;

class ShipmentOrdersExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithColumnFormatting, WithEvents, WithCustomStartCell
{
    protected $filters;

    public function __construct($filters)
    {
        $this->filters = $filters;
    }

    public function startCell(): string
    {
        // All reports now start at A6 to accommodate corporate header
        return 'A6';
    }

    public function query()
    {
        $isSader = $this->filters['is_sader'] ?? false;

        $query = ShipmentOrder::query()
            ->select('shipment_orders.*')
            ->selectRaw(
                'COALESCE(so.name, shipment_orders.origin) as origin_name'
            )
            ->leftJoin('shipment_origins as so', 'so.id', '=', 'shipment_orders.origin_id')
            ->with([
                'client',
                'sales_order',
                'weight_ticket.lot',
                'weight_ticket.weighmaster',
                'weight_ticket.loadingOrder',
                'creator',
                'loadingOrders.weight_ticket.lot',
                'items.product',
            ]);

        // Filter by SADER
        if ($isSader) {
            $query->where(function ($q) {
                $q->whereRaw("UPPER(TRIM(consigned_to)) = 'SADER'")
                    ->orWhere('consigned_to', 'SADER');
            });
            // Only include records that have physically completed the weighing process
            $query->whereHas('weight_ticket', function ($q) {
                $q->whereNotNull('weigh_out_at');
            });
        } else {
            $query->where(function ($q) {
                // EXCLUDE SADER robustly
                $q->where(function ($sq) {
                    $sq->whereRaw("UPPER(TRIM(COALESCE(consigned_to, ''))) != 'SADER'")
                        ->orWhereNull('consigned_to');
                });
            });
            // V21: Only include records that have physically completed the weighing process for General Report too
            $query->whereHas('weight_ticket', function ($q) {
                $q->whereNotNull('weigh_out_at');
            });
        }

        // Always exclude cancelled orders
        $query->where('status', '!=', 'cancelled');

        // Active filters from UI
        // SADER report should IGNORE the search filter to ensure full daily availability
        if (!$isSader && !empty($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('folio', 'like', "%{$search}%")
                    ->orWhere('operator_name', 'like', "%{$search}%")
                    ->orWhere('transport_company', 'like', "%{$search}%")
                    ->orWhere('consigned_to', 'like', "%{$search}%")
                    ->orWhereHas('client', function ($q2) use ($search) {
                        $q2->where('business_name', 'like', "%{$search}%");
                    });
            });
        }

        // Operational Range Filter if provided
        if (!empty($this->filters['start_date']) && !empty($this->filters['end_date'])) {
            $range = OperationalTimeHelper::getOperationalRange($this->filters['start_date'], $this->filters['end_date']);

            $query->whereHas('weight_ticket', function ($q2) use ($range) {
                $q2->whereBetween('weigh_out_at', $range);
            });
        } elseif (!empty($this->filters['date'])) {
            $range = OperationalTimeHelper::getOperationalRange($this->filters['date']);

            $query->where(function ($q) use ($range, $isSader) {
                if ($isSader) {
                    // For SADER, filter ONLY by final weight out time (Completion)
                    $q->whereHas('weight_ticket', function ($q2) use ($range) {
                        $q2->whereBetween('weigh_out_at', $range);
                    });
                } else {
                    // V21: General Report now only filters by completed weighing too
                    $q->whereHas('weight_ticket', function ($q2) use ($range) {
                        $q2->whereBetween('weigh_out_at', $range);
                    });
                }
            });
        }

        return $query->orderByDesc('shipment_orders.created_at');
    }

    public function headings(): array
    {
        // Unified headings for all reports
        return [
            'TICKET',
            'FECHA DE CARGA',
            'CATEGORIA',
            'ORIGEN DEL PRODUCTO',
            'ORDEN DE VENTA',
            'O.E',
            'CLIENTE',
            'CONSIGNADO',
            'PRIMER CONSIGNADO',
            'DESTINO CONSIGNADO',
            'ESTADO',
            'CODIGO',
            'PRODUCTO',
            'PRESENTACION',
            'NO. DE LOTE',
            'PB',
            'PT',
            'PN',
            'P.PROG',
            'NO. DE SACOS',
            'ENVASE',
            'ALMACEN',
            'ENTRADA',
            'SALIDA',
            'LINEA TRANSPORTISTA',
            'OPERADOR',
            'CARTA PORTE',
            'TIPO DE UNIDAD',
            'P.TRACTOR',
            'ECONOMICO',
            'P.REMOLQUE',
            'DOCUMENTADOR',
            'OP. DE BASCULA'
        ];
    }

    public function map($order): array
    {
        // Robust Ticket & LoadingOrder Resolution
        // Goal: Find the ticket that actually has the lot assigned during Destare.
        $ticket = null;
        $loadingOrder = null;

        // 1. Try to find a ticket with a lot within associated loading orders
        foreach ($order->loadingOrders as $lo) {
            if ($lo->weight_ticket) {
                // If it has a lot, this is definitely our target
                if ($lo->weight_ticket->lot_id) {
                    $ticket = $lo->weight_ticket;
                    $loadingOrder = $lo;
                    break;
                }
                // Fallback to the first ticket found if none have a lot yet
                if (!$ticket) {
                    $ticket = $lo->weight_ticket;
                    $loadingOrder = $lo;
                }
            }
        }

        // 2. Fallback to the direct ticket if still no lot found
        if (!$ticket || !$ticket->lot_id) {
            if ($order->weight_ticket) {
                $ticket = $order->weight_ticket;
                // If this direct ticket has a lot, use it.
            }
        }

        // 3. Ensure we have at least any loading order for warehouse/etc fallback
        $loadingOrder = $loadingOrder ?? $order->loadingOrders->first();

        $isSader = $this->filters['is_sader'] ?? false;

        // Lot Folio Resolution (Master Strategy V18.2)
        // We scan everything: Direct OE ticket, and then all Loading Orders (Trips)
        $lotFolio = 'N/A';
        $foundLotId = null;

        // Priority 1: Check early for the direct ticket if it exists and has a lot
        if ($order->weight_ticket && $order->weight_ticket->lot_id) {
            $ticket = $order->weight_ticket;
            $foundLotId = $ticket->lot_id;
        }

        // Priority 2: Scan Loading Orders if still no lot
        if (!$foundLotId) {
            foreach ($order->loadingOrders as $lo) {
                if ($lo->weight_ticket && $lo->weight_ticket->lot_id) {
                    $ticket = $lo->weight_ticket;
                    $foundLotId = $ticket->lot_id;
                    $loadingOrder = $lo;
                    break;
                }
            }
        }

        // Final resolution of the folio string and Warehouse
        $warehouseValue = null;
        if ($foundLotId) {
            // Priority 1: Get warehouse directly from the Lot record
            $lotData = DB::table('lots')->where('id', $foundLotId)->first(['folio', 'warehouse']);
            $lotFolio = $lotData->folio ?? 'N/A';
            $warehouseValue = $lotData->warehouse ?? null;
        }

        // Final Almacen resolution (Lot Warehouse > Loading Order Warehouse > OE Warehouse)
        $almacen = $warehouseValue
            ?? $loadingOrder->warehouse
            ?? $order->warehouse
            ?? 'N/A';

        if (empty($almacen) || $almacen === 'N/A') {
            $almacen = 'N/A';
        }

        // Product Logic
        $productObj = $order->items->first()?->product;
        $productName = $order->product ?? ($productObj->name ?? 'N/A');
        $productCode = 'N/A';

        if ($productObj) {
            $productCode = $productObj->code;
        } else {
            $p = Product::where('name', $productName)->first();
            if ($p)
                $productCode = $p->code;
        }

        // Weight/Date Logic
        $rawDate = $ticket->weigh_out_at ?? $order->created_at;
        $fechaCarga = OperationalTimeHelper::getOperativeDate($rawDate);
        $fechaCarga = Carbon::parse($fechaCarga)->format('d/m/Y');

        // Sacks Calculation Logic (Numeric and Precise)
        $sacksValue = '0';
        if ($order->presentation && strpos(strtoupper($order->presentation), 'ENVASADO') !== false) {
            $tons = (float) ($order->programmed_tons ?? 0);
            
            if ($order->sacks_count && strpos(strtoupper($order->sacks_count), 'SACO') !== false) {
                // Use manual value directly (e.g. "35 SACOS")
                $sacksValue = $order->sacks_count;
            } elseif ($order->sacks_count && strpos(strtoupper($order->sacks_count), 'KG') !== false) {
                // Standard automatic size (e.g. "50 KG")
                $size = (int) preg_replace('/[^0-9]/', '', $order->sacks_count);
                if ($size > 0) {
                    $sacksValue = round(($tons * 1000) / $size);
                }
            } else {
                // Fallback using net weight if available
                $netWeight = (float) ($ticket->net_weight ?? 0);
                if ($netWeight > 0 && $order->sacks_count) {
                    $size = (int) preg_replace('/[^0-9]/', '', $order->sacks_count);
                    if ($size > 0) {
                        $sacksValue = round($netWeight / $size);
                    }
                }
            }

            // Ensure Product Name includes size for Envasado (Report Requirement)
            if ($order->sacks_count && strpos(strtoupper($order->sacks_count), 'KG') !== false) {
                preg_match('/(\d+)\s*KG/i', $order->sacks_count, $matches);
                if (isset($matches[1])) {
                    $suffix = " - " . $matches[1] . " KG";
                    if (strpos($productName, $suffix) === false) {
                        $productName .= $suffix;
                    }
                }
            }
        }

        $ticketFolio = $ticket?->loadingOrder?->folio
            ?? $ticket?->ticket_number
            ?? $order->folio
            ?? 'N/A';

        // Unified Mapping (Tons for all reports)
        return [
            $ticketFolio,
            $fechaCarga,
            'SIN DATOS',
            ($order->origin_name ?: 'N/A'),
            $order->sale_order_folio ?? ($order->sales_order?->folio ?? 'N/A'),
            $order->folio,
            $order->client?->business_name ?? ($order->client_name ?? 'N/A'),
            $order->consigned_to ?? 'N/A',
            'SIN DATOS',
            $order->destination ?? 'N/A',
            $order->state ?? 'N/A',
            $productCode,
            $productName,
            $order->presentation ?? 'N/A',
            $lotFolio,
            ($ticket->gross_weight ?? 0) / 1000,
            ($ticket->tare_weight ?? 0) / 1000,
            ($ticket->net_weight ?? 0) / 1000,
            (float) ($order->programmed_tons ?? 0),
            $sacksValue,
            $ticket->packaging_type ?? 'N/A',
            $almacen,
            $ticket && $ticket->weigh_in_at ? Carbon::parse($ticket->weigh_in_at)->format('h:i A') : '---',
            $ticket && $ticket->weigh_out_at ? Carbon::parse($ticket->weigh_out_at)->format('h:i A') : '---',
            $order->transport_company ?? 'N/A',
            $order->operator_name ?? ($order->driver->name ?? 'N/A'),
            $order->carta_porte ?? 'N/A',
            $order->unit_type ?? 'N/A',
            $order->tractor_plate ?? 'N/A',
            $order->economic_number ?? 'N/A',
            $order->trailer_plate ?? 'N/A',
            $order->creator->name ?? 'DOCUMENTACIÓN',
            $ticket->weighmaster->name ?? '---'
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $isSader = $this->filters['is_sader'] ?? false;
        // Unified Green color for all reports (SADER Green)
        $headerColor = '22C55E';
        // Always start styling from Row 6 (where headings are)
        $headerRow = 6;
        $lastCol = 'AG';

        $styles = [
            $headerRow => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => $headerColor]
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
            ],
            "A:$lastCol" => [
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
            ],
        ];

        // All reports now use corporate styling
        $sheet->mergeCells('A1:AG1');
        $sheet->mergeCells('A2:AG2');
        $sheet->mergeCells('A3:AG3');
        $sheet->mergeCells('A4:AG4');
        $sheet->mergeCells('A5:AG5');

        $sheet->setCellValue('A1', 'PRO-AGROINDUSTRIA, S.A. DE C.V.');
        $sheet->setCellValue('A2', 'CONTROL DE PESAJE DE UNIDADES');
        $sheet->setCellValue('A3', 'JEFATURA DE TRAFICO');
        $sheet->setCellValue('A4', '');
        $sheet->setCellValue('A5', 'REGISTRO DE SALIDA DE PRODUCTO');

        $sheet->getStyle('A1:AG5')->getFont()->setBold(true);
        $sheet->getStyle('A1')->getFont()->setSize(14);
        $sheet->getStyle('A1:AG5')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Red Line under corporate header (A1 to AG1 bottom)
        $sheet->getStyle('A1:AG1')->getBorders()->getBottom()->setBorderStyle(Border::BORDER_THICK)->getColor()->setRGB('FF0000');

        return $styles;
    }

    public function columnFormats(): array
    {
        $isSader = $this->filters['is_sader'] ?? false;

        return [
            'P' => '0.000', // PB
            'Q' => '0.000', // PT
            'R' => '0.000', // PN
            'S' => '0.00',  // P.PROG
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $isSader = $this->filters['is_sader'] ?? false;
                $headerRow = 6;
                $lastCol = 'AG';

                // Set Filter on Headings row
                $event->sheet->setAutoFilter("A{$headerRow}:{$lastCol}{$headerRow}");
            },
        ];
    }
}
