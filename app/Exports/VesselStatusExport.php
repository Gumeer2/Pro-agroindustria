<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use App\Exports\Sheets\VesselExecutiveSheet;
use App\Exports\Sheets\VesselDataSheet;

class VesselStatusExport implements WithMultipleSheets
{
    use Exportable;

    protected $vessel;
    protected $stats;
    protected $charts;

    public function __construct($vessel, $stats, $charts)
    {
        $this->vessel = $vessel;
        $this->stats = $stats;
        $this->charts = $charts;
    }

    /**
     * @return array
     */
    public function sheets(): array
    {
        $sheets = [];

        // Sheet 1: Executive Summary (Visual with Chart)
        $sheets[] = new VesselExecutiveSheet($this->vessel, $this->stats, $this->charts);

        // Sheet 2: Detailed Raw Data
        $sheets[] = new VesselDataSheet($this->vessel->id);

        return $sheets;
    }
}
