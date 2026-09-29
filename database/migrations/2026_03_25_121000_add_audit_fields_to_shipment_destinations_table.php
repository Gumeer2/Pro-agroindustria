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
        Schema::table('shipment_destinations', function (Blueprint $table) {
            if (!Schema::hasColumn('shipment_destinations', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('created_at')->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('shipment_destinations', 'updated_by')) {
                $table->foreignId('updated_by')->nullable()->after('updated_at')->constrained('users')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shipment_destinations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');
            $table->dropConstrainedForeignId('updated_by');
        });
    }
};
