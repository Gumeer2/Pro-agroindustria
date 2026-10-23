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
                if (!Schema::hasColumn('exit_operators', 'client_ids')) {
                    $table->json('client_ids')->nullable()->after('trailer_plate');
                }
            });
        }

        if (!Schema::hasTable('client_exit_operator')) {
            Schema::create('client_exit_operator', function (Blueprint $table) {
                $table->id();
                $table->foreignId('exit_operator_id')->constrained('exit_operators')->onDelete('cascade');
                $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
                $table->timestamps();

                $table->unique(['exit_operator_id', 'client_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('client_exit_operator')) {
            Schema::dropIfExists('client_exit_operator');
        }

        if (Schema::hasTable('exit_operators')) {
            Schema::table('exit_operators', function (Blueprint $table) {
                if (Schema::hasColumn('exit_operators', 'client_ids')) {
                    $table->dropColumn('client_ids');
                }
            });
        }
    }
};
