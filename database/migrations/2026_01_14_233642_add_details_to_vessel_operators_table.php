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
        Schema::table('vessel_operators', function (Blueprint $table) {
            $table->string('real_transporter_line')->nullable()->after('transporter_line');
            $table->string('brand_model')->nullable()->after('unit_type');
            $table->string('license')->nullable()->after('operator_name');
            $table->string('policy')->nullable()->after('economic_number');
            $table->date('validity')->nullable()->after('policy');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vessel_operators', function (Blueprint $table) {
            $table->dropColumn(['real_transporter_line', 'brand_model', 'license', 'policy', 'validity']);
        });
    }
};
