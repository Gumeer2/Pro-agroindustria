<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('shipment_orders', function (Blueprint $table) {
            // Document Fields
            $table->string('request_id')->nullable()->after('folio'); // Pedido

            // Client Snapshot Fields (in case they differ from master or for history)
            $table->string('client_name')->nullable()->after('client_id');
            $table->string('rfc')->nullable()->after('client_name');
            $table->string('address')->nullable()->after('rfc');
            $table->string('consigned_to')->nullable()->after('address');

            // Transporter Fields
            $table->string('transport_company')->nullable()->after('consigned_to');
            $table->string('operator_name')->nullable()->after('transport_company');
            $table->string('unit_number')->nullable()->after('operator_name');
            $table->string('tractor_plate')->nullable()->after('unit_number');
            $table->string('trailer_plate')->nullable()->after('tractor_plate');
            $table->string('carta_porte')->nullable()->after('trailer_plate');
            $table->string('license_number')->nullable()->after('carta_porte');
            $table->string('unit_type')->nullable()->after('license_number');
            $table->string('economic_number')->nullable()->after('unit_type');
            $table->string('qr_code')->nullable()->after('economic_number');

            // Shipment Details
            $table->string('origin')->nullable()->after('qr_code');
            $table->string('product')->nullable()->after('origin'); // Can be snapshot of product name
            $table->string('presentation')->nullable()->after('product');
            $table->string('sacks_count')->nullable()->after('presentation'); // Saco
            $table->decimal('programmed_tons', 10, 2)->nullable()->after('sacks_count');
            $table->string('shortage_balance')->nullable()->after('programmed_tons'); // Saldo

            // Control fields
            $table->string('documenter_name')->nullable()->after('shortage_balance');
            $table->string('scale_name')->nullable()->after('documenter_name');

            // Status flags matching the image checkboxes if needed, 
            // but we have a 'status' enum. Let's keep using enum for main flow, 
            // but mapped to these fields if they are distinct checkboxes.
            // Image shows: Estado: [        ]. Likely a text field or dropdown.
            // We already have 'status' enum.

            // 'sale_conditions', 'delivery_conditions', 'destination', 'observations' existing from previous migration
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shipment_orders', function (Blueprint $table) {
            $table->dropColumn([
                'request_id',
                'client_name',
                'rfc',
                'address',
                'consigned_to',
                'transport_company',
                'operator_name',
                'unit_number',
                'tractor_plate',
                'trailer_plate',
                'carta_porte',
                'license_number',
                'unit_type',
                'economic_number',
                'qr_code',
                'origin',
                'product',
                'presentation',
                'sacks_count',
                'programmed_tons',
                'shortage_balance',
                'documenter_name',
                'scale_name'
            ]);
        });
    }
};
