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

class DashboardExecutiveSheet implements FromArray, WithTitle, WithStyles, WithColumnWidths, WithDrawings, WithCharts
{
    protected $stats;
    protected $charts;
    protected $filters;
    protected $dataStartRow = 28; // Data starts lower to make room for charts

    public function __construct($stats, $charts, $filters)
    {
        $this->stats = $stats;
        $this->charts = $charts;
        $this->filters = $filters;
    }

    public function drawings()
    {
        $drawings = [];
        $tenant = config('app.tenant');

        // Logo VECODE (System)
        if (file_exists(public_path('images/Logo_vde.png'))) {
            $drawing = new Drawing();
            $drawing->setName('Logo VECODE');
            $drawing->setDescription('Logo VECODE');
            $drawing->setPath(public_path('images/Logo_vde.png'));
            $drawing->setHeight(50);
            $drawing->setCoordinates('B2');
            $drawing->setOffsetX(10);
            $drawings[] = $drawing;
        }

        // Tenant Logo
        $logoPath = $tenant && $tenant->logo ? public_path(str_replace('/', DIRECTORY_SEPARATOR, ltrim($tenant->logo, '/'))) : public_path('images/Proagro2.png');

        if (file_exists($logoPath)) {
            $drawing2 = new Drawing();
            $drawing2->setName('Logo ' . ($tenant ? $tenant->name : 'Tenant'));
            $drawing2->setDescription('Logo ' . ($tenant ? $tenant->name : 'Tenant'));
            $drawing2->setPath($logoPath);
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

        // --- DASHBOARD HEADER AREA (Blue Background) ---
        // Row 1-6 will be colored Blue to mimic the Web App Header
        $rows[] = ['', '', '', '', '', ''];
        $rows[] = ['', '', '', '', '', ''];
        $rows[] = ['', '', '', '', '', ''];
        $rows[] = ['', 'REPORTE EJECUTIVO DE OPERACIONES', '', '', '', ''];
        $rows[] = ['', 'Generado por VECODE | ' . Carbon::now()->format('d/m/Y H:i'), '', '', '', ''];

        // Context Line
        $rows[] = ['', $this->getFilterContext(), '', '', '', ''];

        // --- KPI CARDS AREA ---
        $rows[] = ['', '', '', '', '', '']; // Spacer

        // KPI Headers
        $rows[] = ['', 'TONELAJE TOTAL', 'VIAJES', 'UNIDADES EN CIRCUITO', 'BÁSCULA (MT)', 'BURREO (MT)'];

        // KPI Values
        $rows[] = [
            '',
            number_format($this->stats['total_tonnage'] / 1000, 3) . ' MT',
            $this->stats['trips_completed'],
            $this->stats['units_in_circuit'],
            number_format($this->stats['total_scale'] / 1000, 3),
            number_format($this->stats['total_burreo'] / 1000, 3)
        ];

        $rows[] = ['', '', '', '', '', '']; // Spacer

        // Space for Chart (Rows 11-26 approx)
        for ($i = 0; $i < 16; $i++) {
            $rows[] = ['', '', '', '', '', ''];
        }

        $rows[] = ['', 'DETALLE DIARIO', '', '', '', '']; // Table Header
        $rows[] = ['', 'Fecha', 'Total (MT)', 'Báscula (MT)', 'Burreo (MT)', '']; // Table Columns

        // Data Rows for Chart Source
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

        // Series 1: Total Tonnage (Column C)
        // Categories: Dates (Column B)
        $categories = [new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, '\'Dashboard Ejecutivo\'!$B$' . $startRow . ':$B$' . $endRow, null, $rowCount)];

        // Values
        $values = [
            new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_NUMBER, '\'Dashboard Ejecutivo\'!$C$' . $startRow . ':$C$' . $endRow, null, $rowCount),
        ];

        $series = new DataSeries(
            DataSeries::TYPE_BARCHART, // Plot Type
            DataSeries::GROUPING_CLUSTERED,
            range(0, count($values) - 1),
            [new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, null, null, 1, ['Total (MT)'])], // Legend Labels
            $categories,
            $values
        );

        $layout = new \PhpOffice\PhpSpreadsheet\Chart\Layout();
        $layout->setShowVal(true);

        $plotArea = new PlotArea($layout, [$series]);
        $legend = new Legend(Legend::POSITION_BOTTOM, null, false);
        $title = new Title('Historia de Descarga Diaria');

        $chart = new Chart(
            'daily_tonnage_chart',
            $title,
            $legend,
            $plotArea,
            true,
            'gap',
            null,
            null
        );

        $chart->setTopLeftPosition('B11');
        $chart->setBottomRightPosition('F26'); // Position in the spacer area

        return [$chart];
    }

    public function styles(Worksheet $sheet)
    {
        $tenant = config('app.tenant');
        $primaryColor = $tenant ? str_replace('#', '', $tenant->primary_color) : '1e3a8a';
        $secondaryColor = $tenant ? str_replace('#', '', $tenant->secondary_color) : 'bfdbfe';

        // 1. Header Background (Rows 1-6)
        $sheet->getStyle('A1:F6')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($primaryColor);

        // 2. Main Title
        $sheet->mergeCells('B4:F4');
        $sheet->getStyle('B4')->getFont()->setBold(true)->setSize(18)->getColor()->setARGB('FFFFFF');
        $sheet->getStyle('B4')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

        // 3. Subtitle / Details
        $sheet->mergeCells('B5:F5');
        $sheet->getStyle('B5')->getFont()->setSize(11)->getColor()->setARGB('cbd5e1'); // Slate 300

        $sheet->mergeCells('B6:F6');
        $sheet->getStyle('B6')->getFont()->setBold(true)->setSize(11)->getColor()->setARGB($secondaryColor);

        // 4. KPI Headers
        $sheet->getStyle('B8:F8')->getFont()->setBold(true)->getColor()->setARGB('64748b'); // Slate 500
        $sheet->getStyle('B8:F8')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // 5. KPI Values (Big Cards)
        $sheet->getStyle('B9:F9')->getFont()->setBold(true)->setSize(14)->getColor()->setARGB($primaryColor);
        $sheet->getStyle('B9:F9')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Add Borders to KPIs to look like Cards
        $sheet->getStyle('B8:F9')->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        $sheet->getStyle('B8:F9')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('f8fafc'); // Slate 50

        // 6. Data Table Header
        $tableHeaderRow = 27;
        $sheet->getStyle('B' . $tableHeaderRow . ':E' . $tableHeaderRow)->getFont()->setBold(true)->getColor()->setARGB('FFFFFF');
        $sheet->getStyle('B' . $tableHeaderRow . ':E' . $tableHeaderRow)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($primaryColor);
        $sheet->getStyle('B' . $tableHeaderRow . ':E' . $tableHeaderRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $colHeaderRow = 28;
        $sheet->getStyle('B' . $colHeaderRow . ':E' . $colHeaderRow)->getFont()->setBold(true)->getColor()->setARGB($primaryColor);
        $sheet->getStyle('B' . $colHeaderRow . ':E' . $colHeaderRow)->getBorders()->getBottom()->setBorderStyle(Border::BORDER_THICK);

        // 7. Table Data
        $lastRow = $sheet->getHighestRow();
        if ($lastRow >= 29) {
            $sheet->getStyle('B28:E' . $lastRow)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        }

        // Hide Gridlines
        $sheet->setShowGridlines(false);
    }

    public function columnWidths(): array
    {
        return [
            'A' => 2,   // Margin
            'B' => 25,  // Date / Metric
            'C' => 18,  // Value
            'D' => 18,  // Value
            'E' => 18,  // Value
            'F' => 18,  // Value
        ];
    }

    public function title(): string
    {
        return 'Dashboard Ejecutivo';
    }

    private function getFilterContext()
    {
        $context = $this->filters['vessel_name'] ?? 'Global';

        if (!empty($this->filters['specific_date'])) {
            $context .= ' | Fecha: ' . $this->filters['specific_date'];
        } elseif (!empty($this->filters['start_date']) && !empty($this->filters['end_date'])) {
            $context .= ' | Rango: ' . $this->filters['start_date'] . ' al ' . $this->filters['end_date'];
        }

        if (!empty($this->filters['warehouse']))
            $context .= ' | Alm: ' . $this->filters['warehouse'];
        if (!empty($this->filters['operator']))
            $context .= ' | Op: ' . $this->filters['operator'];

        return $context;
    }
}
