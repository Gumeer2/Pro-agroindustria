<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('client_operator_assignments') && !Schema::hasColumn('client_operator_assignments', 'type')) {
            Schema::table('client_operator_assignments', function (Blueprint $table) {
                $table->string('type', 100)->nullable()->after('sack');
            });
        }

        if (Schema::hasTable('exit_operators') && !Schema::hasColumn('exit_operators', 'type')) {
            Schema::table('exit_operators', function (Blueprint $table) {
                $table->string('type', 100)->nullable()->after('sack');
            });
        }

        if (Schema::hasTable('client_exit_operator') && !Schema::hasColumn('client_exit_operator', 'type')) {
            Schema::table('client_exit_operator', function (Blueprint $table) {
                $table->string('type', 100)->nullable()->after('sack');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('client_operator_assignments') && Schema::hasColumn('client_operator_assignments', 'type')) {
            Schema::table('client_operator_assignments', function (Blueprint $table) {
                $table->dropColumn('type');
            });
        }

        if (Schema::hasTable('exit_operators') && Schema::hasColumn('exit_operators', 'type')) {
            Schema::table('exit_operators', function (Blueprint $table) {
                $table->dropColumn('type');
            });
        }

        if (Schema::hasTable('client_exit_operator') && Schema::hasColumn('client_exit_operator', 'type')) {
            Schema::table('client_exit_operator', function (Blueprint $table) {
                $table->dropColumn('type');
            });
        }
    }
};

