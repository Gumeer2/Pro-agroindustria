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
        if (!Schema::hasTable('shipment_sampling_incidents')) {
            Schema::create('shipment_sampling_incidents', function (Blueprint $table) {
                $table->id();
                $table->foreignUuid('shipment_order_id')->nullable()->constrained('shipment_orders')->nullOnDelete();
                $table->string('order_folio')->nullable();
                $table->string('warehouse')->nullable();
                $table->foreignId('unlocked_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('unlocked_by_name')->nullable();
                $table->string('assistant_name')->nullable();
                $table->integer('unlock_count')->default(1);
                $table->text('reason')->nullable();
                $table->timestamp('unlocked_at')->nullable();
                $table->timestamps();

                $table->index('shipment_order_id');
                $table->index('order_folio');
                $table->index('unlocked_at');
            });
        }

        if (!Schema::hasColumn('shipment_process_histories', 'is_sampling_blocked')) {
            Schema::table('shipment_process_histories', function (Blueprint $table) {
                $table->boolean('is_sampling_blocked')->default(false)->after('sampling_status');
                $table->integer('sampling_unlock_count')->default(0)->after('is_sampling_blocked');
            });
        }

        if (!Schema::hasColumn('shipment_orders', 'is_sampling_blocked')) {
            Schema::table('shipment_orders', function (Blueprint $table) {
                $table->boolean('is_sampling_blocked')->default(false)->after('sampling_status');
                $table->integer('sampling_unlock_count')->default(0)->after('is_sampling_blocked');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipment_sampling_incidents');

        if (Schema::hasColumn('shipment_process_histories', 'is_sampling_blocked')) {
            Schema::table('shipment_process_histories', function (Blueprint $table) {
                $table->dropColumn(['is_sampling_blocked', 'sampling_unlock_count']);
            });
        }

        if (Schema::hasColumn('shipment_orders', 'is_sampling_blocked')) {
            Schema::table('shipment_orders', function (Blueprint $table) {
                $table->dropColumn(['is_sampling_blocked', 'sampling_unlock_count']);
            });
        }
    }
};

