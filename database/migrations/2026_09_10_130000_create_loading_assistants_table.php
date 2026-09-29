<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('loading_assistants')) {
            Schema::create('loading_assistants', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->timestamps();
            });
        }

        if (!Schema::hasColumn('shipment_orders', 'loading_assistant')) {
            Schema::table('shipment_orders', function (Blueprint $table) {
                $table->string('loading_assistant')->nullable()->after('loading_squad_leader');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('shipment_orders', 'loading_assistant')) {
            Schema::table('shipment_orders', function (Blueprint $table) {
                $table->dropColumn('loading_assistant');
            });
        }
        Schema::dropIfExists('loading_assistants');
    }
};
