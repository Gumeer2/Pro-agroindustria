<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

use App\Traits\HasAuditTrail;

class LoadingOrder extends Model
{
    use HasUuids, HasAuditTrail;

    protected $guarded = [];

    // --- Relations ---

    // Parent Commercial Order
    public function shipment_order()
    {
        return $this->belongsTo(ShipmentOrder::class);
    }

    // Commercial Sales Order
    public function sales_order()
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function vessel()
    {
        return $this->belongsTo(Vessel::class);
    }

    public function transporter()
    {
        return $this->belongsTo(Transporter::class);
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function weight_ticket()
    {
        return $this->hasOne(WeightTicket::class);
    }

    public function lot()
    {
        return $this->belongsTo(Lot::class, 'lot_id');
    }

    public function apt_scan()
    {
        return $this->hasOne(AptScan::class); // usually one per trip
    }

    public function vessel_operator()
    {
        return $this->belongsTo(VesselOperator::class);
    }

    public function exit_operator()
    {
        return $this->belongsTo(ExitOperator::class);
    }

    public function loading_operation()
    {
        return $this->hasOne(LoadingOperation::class);
    }

    // --- Virtual Attributes for Convenience ---

    public function getClientNameAttribute()
    {
        // Snapshot fallback
        return $this->attributes['client_name'] ?? $this->client->business_name ?? 'N/A';
    }

    /**
     * Get the folios of the associated Sales Order if it exists.
     * This provides a safe fallback for the removed 'sale_order' column.
     */
    public function getSaleOrderFolioAttribute()
    {
        return $this->sales_order?->folio ?? ($this->shipment_order?->sales_order?->folio ?? 'S/A');
    }

    /**
     * Get the customer reference from the Sales Order.
     */
    public function getCustomerReferenceAttribute()
    {
        return $this->sales_order?->sale_order ?? ($this->shipment_order?->sales_order?->sale_order ?? 'N/A');
    }

    public function getFolioAttribute($value)
    {
        return ltrim($value, '_');
    }

    protected $appends = ['client_name', 'sale_order_folio', 'customer_reference'];

    public function vessel_operator_trip()
    {
        return $this->belongsTo(VesselOperatorTrip::class);
    }
}
