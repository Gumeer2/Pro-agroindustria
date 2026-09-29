<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use App\Exports\Sheets\DashboardExecutiveSheet;
use App\Exports\Sheets\DashboardDataSheet;

class DashboardExport implements WithMultipleSheets
{
    use Exportable;

    protected $filters;
    protected $stats;
    protected $charts;

    public function __construct($filters, $stats, $charts)
    {
        $this->filters = $filters;
        $this->stats = $stats;
        $this->charts = $charts;
    }

    /**
     * @return array
     */
    public function sheets(): array
    {
        $sheets = [];

        // Sheet 1: Executive Dashboard (Visual)
        $sheets[] = new DashboardExecutiveSheet($this->stats, $this->charts, $this->filters);

        // Sheet 2: Raw Data (Source)
        $sheets[] = new DashboardDataSheet($this->filters);

        return $sheets;
    }

}
