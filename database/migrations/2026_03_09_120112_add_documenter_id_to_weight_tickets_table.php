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
        Schema::table('weight_tickets', function (Blueprint $table) {
            $table->unsignedBigInteger('documenter_id')->nullable()->after('weighmaster_id');
            $table->foreign('documenter_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('weight_tickets', function (Blueprint $table) {
            $table->dropForeign(['documenter_id']);
            $table->dropColumn('documenter_id');
        });
    }
};
