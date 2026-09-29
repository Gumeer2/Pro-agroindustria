<?php

namespace App\Helpers;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class OperationalTimeHelper
{
    /**
     * Devuelve el rango operativo [inicio, fin] para una fecha o rango de fechas.
    * Si se pasa solo $startDate ('2024-03-02'), el rango es de '2024-03-02 05:00:00' a '2024-03-03 04:59:59'.
     * Si se pasan ambas, el rango cubre desde el inicio de la primera hasta el fin de la segunda.
     */
    public static function getOperationalRange($startDate = null, $endDate = null)
    {
        $startDay = $startDate ?Carbon::parse($startDate) : Carbon::today();
        $endDay = $endDate ?Carbon::parse($endDate) : $startDay->copy();

        $start = $startDay->copy()->setTime(5, 0, 0);
        $end = $endDay->copy()->addDay()->setTime(4, 59, 59);

        return [
            $start->format('Y-m-d H:i:s'),
            $end->format('Y-m-d H:i:s')
        ];
    }

    /**
    * Aplica el desplazamiento operativo de -5 horas a una columna en SQL.
     * Útil para GROUP BY y visualización de "Fecha Operativa".
     */
    public static function getSqlDateOffset($column)
    {
        return "DATE(DATE_SUB($column, INTERVAL 5 HOUR))";
    }

    /**
     * Convierte una fecha/hora real a su fecha operativa (string Y-m-d).
     */
    public static function getOperativeDate($dateTime)
    {
        $dt = Carbon::parse($dateTime);
        return $dt->hour < 5
            ? $dt->subDay()->format('Y-m-d')
            : $dt->format('Y-m-d');
    }

    /**
     * Devuelve el rango estándar (00:00:00 a 23:59:59) para una fecha.
     */
    public static function getStandardRange($startDate = null, $endDate = null)
    {
        $start = $startDate ?Carbon::parse($startDate) : Carbon::today();
        $end = $endDate ?Carbon::parse($endDate) : $start->copy();

        return [
            $start->startOfDay()->format('Y-m-d H:i:s'),
            $end->endOfDay()->format('Y-m-d H:i:s')
        ];
    }

    /**
     * Devuelve la columna formateada como fecha estándar para SQL.
     */
    public static function getSqlDateStandard($column)
    {
        return "DATE($column)";
    }
}
