<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_operator_assignments', function (Blueprint $table) {
            if (!Schema::hasColumn('client_operator_assignments', 'original_tm')) {
                $table->decimal('original_tm', 10, 2)->nullable()->after('tm');
            }
            if (!Schema::hasColumn('client_operator_assignments', 'destared_tm')) {
                $table->decimal('destared_tm', 10, 2)->nullable()->after('original_tm');
            }
            if (!Schema::hasColumn('client_operator_assignments', 'destare_status')) {
                $table->string('destare_status', 30)->default('pending')->after('destared_tm');
            }
            if (!Schema::hasColumn('client_operator_assignments', 'destared_at')) {
                $table->timestamp('destared_at')->nullable()->after('destare_status');
            }
            if (!Schema::hasColumn('client_operator_assignments', 'loading_order_id')) {
                $table->string('loading_order_id', 60)->nullable()->index()->after('destared_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('client_operator_assignments', function (Blueprint $table) {
            $table->dropColumn(['original_tm', 'destared_tm', 'destare_status', 'destared_at', 'loading_order_id']);
        });
    }
};
