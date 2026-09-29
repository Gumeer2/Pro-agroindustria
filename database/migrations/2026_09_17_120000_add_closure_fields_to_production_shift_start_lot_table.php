<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('production_shift_start_lot', function (Blueprint $table) {
            $table->string('status', 20)->default('open')->after('lot_id');
            $table->dateTime('closed_at')->nullable()->after('status');
            $table->foreignId('closed_by')->nullable()->after('closed_at')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('production_shift_start_lot', function (Blueprint $table) {
            $table->dropForeign(['closed_by']);
            $table->dropColumn(['status', 'closed_at', 'closed_by']);
        });
    }
};