<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;

class UnitStatusExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithColumnFormatting
{
    protected $units;

    public function __construct($units)
    {
        $this->units = collect($units);
    }

    public function collection()
    {
        return $this->units;
    }

    public function headings(): array
    {
        return [
            '# OE',
            'CLIENTE',
            'TM',
            'PRODUCTO',
            'ENVASES',
            'ALMACÉN',
            'UBICACIÓN DE LOTE',
            'FECHA DE CARGA',
            'ESTATUS',
            'OBSERVACIONES',
        ];
    }

    public function map($row): array
    {
        $folio = $row['folio'] ?? '---';
        if ($folio === 'Sin Documentar' && !empty($row['tractor_plate']) && $row['tractor_plate'] !== '---') {
            $folio .= ' (' . $row['tractor_plate'] . ')';
        }

        return [
            $folio,
            $row['client'] ?? '---',
            isset($row['programmed_tons']) ? (float) $row['programmed_tons'] : 0.0,
            $row['product'] ?? '---',
            $row['packaging'] ?? '---',
            $row['warehouse'] ?? '---',
            $row['lot_location'] ?? '---',
            $row['loading_date'] ?? '---',
            $row['status_label'] ?? '---',
            $row['observations'] ?? '',
        ];
    }

    public function columnFormats(): array
    {
        return [
            'C' => '#,##0.000',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $highestRow = $sheet->getHighestRow();
        $highestColumn = $sheet->getHighestColumn();

        // Estilo de encabezados
        $sheet->getStyle("A1:{$highestColumn}1")->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['argb' => 'FFFFFFFF'],
                'size' => 11,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FF1E3A8A'], // Navy Blue corporativo
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(28);

        if ($highestRow > 1) {
            // Estilos generales para filas de datos
            $sheet->getStyle("A2:{$highestColumn}{$highestRow}")->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['argb' => 'FFE2E8F0'],
                    ],
                ],
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
            ]);

            // Alineaciones específicas por columna
            $sheet->getStyle("A2:A{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("C2:C{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("E2:E{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("F2:F{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("H2:I{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            // Altura uniforme para filas de datos
            for ($r = 2; $r <= $highestRow; $r++) {
                $sheet->getRowDimension($r)->setRowHeight(20);
            }
        }

        return [];
    }
}
