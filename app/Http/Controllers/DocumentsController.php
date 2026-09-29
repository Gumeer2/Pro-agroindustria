<?php

namespace App\Http\Controllers;

use App\Models\ShipmentOrder;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DocumentsController extends Controller
{
    public function printTicket(string $id)
    {
        $order = ShipmentOrder::with(['client', 'product', 'driver', 'vehicle', 'weight_ticket', 'transporter'])
            ->findOrFail($id);

        if (!$order->weight_ticket) {
           return redirect()->back()->withErrors(['message' => 'Esta orden no tiene ticket de báscula generado.']);
        }

        return Inertia::render('Documents/Ticket', [
            'order' => $order
        ]);
    }

    public function printBillOfLading(string $id)
    {
        $order = ShipmentOrder::with(['client', 'product', 'driver', 'vehicle', 'weight_ticket', 'transporter', 'vessel'])
            ->findOrFail($id);

        return Inertia::render('Documents/BillOfLading', [
            'order' => $order
        ]);
    }
}
