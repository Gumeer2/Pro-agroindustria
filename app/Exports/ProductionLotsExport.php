<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithDrawings;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use Illuminate\Support\Facades\Storage;

class ProductionLotsExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithDrawings
{
    protected $shiftStarts;

    public function __construct($shiftStarts)
    {
        $this->shiftStarts = $shiftStarts;
    }

    public function collection()
    {
        return $this->shiftStarts;
    }

    public function headings(): array
    {
        return [
            'FECHA',
            'HORA',
            'NO. DE LOTE',
            'TURNO',
            'DISPOSICIÓN',
            'UBICACIÓN',
            'PRODUCTO',
            'USUARIO ASIGNADO',
            'PUESTO',
            'EVIDENCIA'
        ];
    }

    public function map($act): array
    {
        $lot = optional($act->shiftStart)->lot;
        $product = str_contains(strtoupper((string) optional($lot)->plant_origin), 'UREA')
            ? 'UREA AGRICOLA'
            : (optional($lot)->plant_origin ?: (optional($lot)->folio ? 'Automático' : '—'));

        return [
            $act->occurred_at ? $act->occurred_at->format('d/m/Y') : ($act->created_at ? $act->created_at->format('d/m/Y') : '—'),
            $act->occurred_at ? $act->occurred_at->format('H:i:s') : ($act->created_at ? $act->created_at->format('H:i:s') : '—'),
            optional($lot)->folio ?: '—',
            optional($act->shiftStart)->shift ?: '—',
            optional($lot)->warehouse ?: '—',
            $act->location ?: (optional($lot)->cubicle ?: 'Automático'),
            $product,
            optional($act->user)->name ?: (optional(optional($act->shiftStart)->user)->name ?: '—'),
            optional($act->shiftStart)->position ?: 'Almacén',
            $this->evidenceLocalPath($act->evidence_path) ? '' : ($act->evidence_path ? 'Registrada' : '—'),
        ];
    }

    public function drawings()
    {
        $drawings = [];
        $row = 2;

        foreach ($this->shiftStarts as $act) {
            $path = $this->evidenceLocalPath($act->evidence_path ?? null);

            if ($path) {
                $drawing = new Drawing();
                $drawing->setName('Evidencia');
                $drawing->setDescription('Evidencia');
                $drawing->setPath($path);
                $drawing->setHeight(80);
                $drawing->setCoordinates('J' . $row);
                $drawing->setOffsetX(5);
                $drawing->setOffsetY(5);
                $drawings[] = $drawing;
            }

            $row++;
        }

        return $drawings;
    }

    /**
     * Resolves the evidence path to a readable local file, or null if unavailable.
     */
    private function evidenceLocalPath(?string $evidencePath): ?string
    {
        if (!$evidencePath) {
            return null;
        }

        if (str_starts_with($evidencePath, 'http://') || str_starts_with($evidencePath, 'https://') || str_starts_with($evidencePath, 'data:')) {
            return null;
        }

        $path = ltrim($evidencePath, '/');
        if (str_starts_with($path, 'storage/')) {
            $path = substr($path, 8);
        }

        return Storage::disk('public')->exists($path) ? Storage::disk('public')->path($path) : null;
    }

    public function styles(Worksheet $sheet)
    {
        $highestRow = $sheet->getHighestRow();
        $highestColumn = $sheet->getHighestColumn();

        foreach ($this->shiftStarts as $index => $act) {
            if ($this->evidenceLocalPath($act->evidence_path ?? null)) {
                $sheet->getRowDimension($index + 2)->setRowHeight(62);
            }
        }

        $sheet->getStyle("A1:{$highestColumn}1")->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['argb' => 'FFFFFFFF'],
                'size' => 11
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FF0369A1'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);

        if ($highestRow > 1) {
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
        }

        return [];
    }
}
