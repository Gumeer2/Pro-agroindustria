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
        Schema::table('vessels', function (Blueprint $table) {
            $table->decimal('provisional_burreo_weight', 10, 2)->nullable()->after('operation_type');
            $table->decimal('draft_weight', 10, 2)->nullable()->after('provisional_burreo_weight');
        });

        Schema::table('weight_tickets', function (Blueprint $table) {
            $table->boolean('is_burreo')->default(false)->after('scale_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vessels', function (Blueprint $table) {
            $table->dropColumn(['provisional_burreo_weight', 'draft_weight']);
        });

        Schema::table('weight_tickets', function (Blueprint $table) {
            $table->dropColumn('is_burreo');
        });
    }
};
