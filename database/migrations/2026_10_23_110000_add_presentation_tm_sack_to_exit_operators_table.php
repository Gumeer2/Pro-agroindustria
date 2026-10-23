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
        if (Schema::hasTable('exit_operators')) {
            Schema::table('exit_operators', function (Blueprint $table) {
                if (!Schema::hasColumn('exit_operators', 'presentation')) {
                    $table->string('presentation')->nullable()->after('trailer_plate');
                }
                if (!Schema::hasColumn('exit_operators', 'tm')) {
                    $table->decimal('tm', 10, 2)->nullable()->after('presentation');
                }
                if (!Schema::hasColumn('exit_operators', 'sack')) {
                    $table->string('sack')->nullable()->after('tm');
                }
            });
        }

        if (Schema::hasTable('client_exit_operator')) {
            Schema::table('client_exit_operator', function (Blueprint $table) {
                if (!Schema::hasColumn('client_exit_operator', 'presentation')) {
                    $table->string('presentation')->nullable()->after('client_id');
                }
                if (!Schema::hasColumn('client_exit_operator', 'tm')) {
                    $table->decimal('tm', 10, 2)->nullable()->after('presentation');
                }
                if (!Schema::hasColumn('client_exit_operator', 'sack')) {
                    $table->string('sack')->nullable()->after('tm');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('exit_operators')) {
            Schema::table('exit_operators', function (Blueprint $table) {
                $columns = array_filter(['presentation', 'tm', 'sack'], fn($c) => Schema::hasColumn('exit_operators', $c));
                if (!empty($columns)) {
                    $table->dropColumn($columns);
                }
            });
        }

        if (Schema::hasTable('client_exit_operator')) {
            Schema::table('client_exit_operator', function (Blueprint $table) {
                $columns = array_filter(['presentation', 'tm', 'sack'], fn($c) => Schema::hasColumn('client_exit_operator', $c));
                if (!empty($columns)) {
                    $table->dropColumn($columns);
                }
            });
        }
    }
};
