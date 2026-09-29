<?php

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithDrawings;
use Maatwebsite\Excel\Concerns\WithCharts;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Chart\Chart;
use PhpOffice\PhpSpreadsheet\Chart\DataSeries;
use PhpOffice\PhpSpreadsheet\Chart\DataSeriesValues;
use PhpOffice\PhpSpreadsheet\Chart\Legend;
use PhpOffice\PhpSpreadsheet\Chart\PlotArea;
use PhpOffice\PhpSpreadsheet\Chart\Title;
use Carbon\Carbon;

class VesselExecutiveSheet implements FromArray, WithTitle, WithStyles, WithColumnWidths, WithDrawings, WithCharts
{
    protected $vessel;
    protected $stats;
    protected $charts;
    protected $dataStartRow = 30;

    public function __construct($vessel, $stats, $charts)
    {
        $this->vessel = $vessel;
        $this->stats = $stats;
        $this->charts = $charts;
    }

    public function drawings()
    {
        $drawings = [];

        // Logo VECODE
        if (file_exists(public_path('images/Logo_vde.png'))) {
            $drawing = new Drawing();
            $drawing->setName('Logo VECODE');
            $drawing->setPath(public_path('images/Logo_vde.png'));
            $drawing->setHeight(50);
            $drawing->setCoordinates('B2');
            $drawing->setOffsetX(10);
            $drawings[] = $drawing;
        }

        // Proagro Logo
        if (file_exists(public_path('images/Proagro2.png'))) {
            $drawing2 = new Drawing();
            $drawing2->setName('Proagro');
            $drawing2->setPath(public_path('images/Proagro2.png'));
            $drawing2->setHeight(50);
            $drawing2->setCoordinates('E2');
            $drawing2->setOffsetX(50);
            $drawings[] = $drawing2;
        }

        return $drawings;
    }

    public function array(): array
    {
        $rows = [];

        // Header Spacers
        for ($i = 0; $i < 3; $i++)
            $rows[] = ['', '', '', '', '', ''];

        // Title Rows
        $rows[] = ['', 'ESTADO DE OPERACIÓN MARÍTIMA', '', '', '', ''];
        $rows[] = ['', 'BUQUE: ' . strtoupper($this->vessel->name) . ' | ' . Carbon::now()->format('d/m/Y H:i'), '', '', '', ''];
        $rows[] = ['', 'Tipo: ' . ($this->vessel->type ?? 'N/A') . ' | Operación: ' . ($this->vessel->operation_type ?? 'N/A'), '', '', '', ''];

        $rows[] = ['', '', '', '', '', '']; // Spacer

        // KPI Headers
        $rows[] = ['', 'TONELAJE ACUMULADO', 'TOTAL VIAJES', 'DIAS EN MUELLE', 'ETB / HORA ATRACO', 'ESTATUS'];

        // KPI Values
        $rows[] = [
            '',
            number_format($this->stats['total_weight'] / 1000, 3) . ' MT',
            $this->stats['total_trips'],
            $this->stats['stay_days'] . ' DÍAS',
            $this->vessel->etb ?? $this->vessel->berthal_datetime ?? '---',
            'EN OPERACIÓN'
        ];

        $rows[] = ['', '', '', '', '', '']; // Spacer

        // Chart Placeholder Rows (Filtered via Styles)
        for ($i = 0; $i < 16; $i++)
            $rows[] = ['', '', '', '', '', ''];

        // Daily Data Table
        $rows[] = ['', 'HISTÓRICO DE DESCARGA', '', '', '', ''];
        $rows[] = ['', 'Fecha', 'Total (MT)', 'Báscula (MT)', 'Burreo (MT)', ''];

        foreach ($this->charts['daily_tonnage'] as $day) {
            $rows[] = [
                '',
                $day['date'],
                round($day['total'] / 1000, 3),
                round($day['scale'] / 1000, 3),
                round($day['burreo'] / 1000, 3),
                ''
            ];
        }

        return $rows;
    }

    public function charts()
    {
        $rowCount = count($this->charts['daily_tonnage']);
        if ($rowCount === 0)
            return [];

        $startRow = 29;
        $endRow = $startRow + $rowCount - 1;

        $categories = [new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, '\'Resumen Ejecutivo\'!$B$' . $startRow . ':$B$' . $endRow, null, $rowCount)];
        $values = [
            new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_NUMBER, '\'Resumen Ejecutivo\'!$C$' . $startRow . ':$C$' . $endRow, null, $rowCount),
        ];

        $series = new DataSeries(
            DataSeries::TYPE_BARCHART,
            DataSeries::GROUPING_CLUSTERED,
            range(0, count($values) - 1),
            [new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, null, null, 1, ['Peso Diario (MT)'])],
            $categories,
            $values
        );

        $plotArea = new PlotArea(null, [$series]);
        $legend = new Legend(Legend::POSITION_BOTTOM, null, false);
        $title = new Title('Progresión Diaria de Descarga');

        $chart = new Chart('daily_tonnage_vessel', $title, $legend, $plotArea, true, 'gap');
        $chart->setTopLeftPosition('B11');
        $chart->setBottomRightPosition('F27');

        return [$chart];
    }

    public function styles(Worksheet $sheet)
    {
        $primaryColor = '1e3a8a'; // Deep Blue
        $secondaryColor = 'bfdbfe'; // Light Blue

        // Header Background
        $sheet->getStyle('A1:F6')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($primaryColor);

        // Titles
        $sheet->mergeCells('B4:F4');
        $sheet->getStyle('B4')->getFont()->setBold(true)->setSize(18)->getColor()->setARGB('FFFFFF');

        $sheet->mergeCells('B5:F5');
        $sheet->getStyle('B5')->getFont()->setSize(11)->getColor()->setARGB('cbd5e1');

        $sheet->mergeCells('B6:F6');
        $sheet->getStyle('B6')->getFont()->setBold(true)->setSize(11)->getColor()->setARGB($secondaryColor);

        // KPIs
        $sheet->getStyle('B8:F8')->getFont()->setBold(true)->getColor()->setARGB('64748b');
        $sheet->getStyle('B8:F8')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->getStyle('B9:F9')->getFont()->setBold(true)->setSize(14)->getColor()->setARGB($primaryColor);
        $sheet->getStyle('B9:F9')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('B8:F9')->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        $sheet->getStyle('B8:F9')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('f8fafc');

        // Table Header
        $tableHeaderRow = 28;
        $sheet->getStyle('B' . $tableHeaderRow . ':E' . $tableHeaderRow)->getFont()->setBold(true)->getColor()->setARGB('FFFFFF');
        $sheet->getStyle('B' . $tableHeaderRow . ':E' . $tableHeaderRow)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($primaryColor);

        $colHeaderRow = 28;
        $sheet->getStyle('B' . $colHeaderRow . ':E' . $colHeaderRow)->getFont()->setBold(true);
        $sheet->getStyle('B' . $colHeaderRow . ':E' . $colHeaderRow)->getBorders()->getBottom()->setBorderStyle(Border::BORDER_THICK);

        $sheet->setShowGridlines(false);
    }

    public function columnWidths(): array
    {
        return ['A' => 2, 'B' => 25, 'C' => 18, 'D' => 18, 'E' => 18, 'F' => 18];
    }

    public function title(): string
    {
        return 'Resumen Ejecutivo';
    }
}
