<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('clients') && !Schema::hasColumn('clients', 'bag_types')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->json('bag_types')->nullable()->after('contact_info');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('clients') && Schema::hasColumn('clients', 'bag_types')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->dropColumn('bag_types');
            });
        }
    }
};
