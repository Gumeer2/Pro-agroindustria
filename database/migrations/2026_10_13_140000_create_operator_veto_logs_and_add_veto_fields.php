<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\ExitOperator;
use Carbon\Carbon;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create operator_veto_logs table
        if (!Schema::hasTable('operator_veto_logs')) {
            Schema::create('operator_veto_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('operator_id');
                $table->string('operator_type')->default('App\\Models\\ExitOperator');
                $table->string('operator_name')->nullable();
                $table->string('license')->nullable();
                $table->string('tractor_plate')->nullable();
                $table->string('trailer_plate')->nullable();
                $table->string('transport_line')->nullable();
                $table->string('economic_number')->nullable();
                $table->enum('action', ['vetoed', 'unvetoed'])->default('vetoed');
                $table->text('reason')->nullable();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->timestamps();

                $table->index(['operator_id', 'operator_type']);
                $table->index('action');
                $table->index('created_at');
                $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            });
        }

        // 2. Add veto audit columns to exit_operators table if they do not exist
        if (Schema::hasTable('exit_operators')) {
            Schema::table('exit_operators', function (Blueprint $table) {
                if (!Schema::hasColumn('exit_operators', 'veto_reason')) {
                    $table->text('veto_reason')->nullable()->after('status');
                }
                if (!Schema::hasColumn('exit_operators', 'vetoed_at')) {
                    $table->timestamp('vetoed_at')->nullable()->after('veto_reason');
                }
                if (!Schema::hasColumn('exit_operators', 'vetoed_by')) {
                    $table->unsignedBigInteger('vetoed_by')->nullable()->after('vetoed_at');
                    $table->foreign('vetoed_by')->references('id')->on('users')->nullOnDelete();
                }
                if (!Schema::hasColumn('exit_operators', 'unveto_reason')) {
                    $table->text('unveto_reason')->nullable()->after('vetoed_by');
                }
                if (!Schema::hasColumn('exit_operators', 'unvetoed_at')) {
                    $table->timestamp('unvetoed_at')->nullable()->after('unveto_reason');
                }
                if (!Schema::hasColumn('exit_operators', 'unvetoed_by')) {
                    $table->unsignedBigInteger('unvetoed_by')->nullable()->after('unvetoed_at');
                    $table->foreign('unvetoed_by')->references('id')->on('users')->nullOnDelete();
                }
            });
        }

        // 3. Add status and veto audit columns to vessel_operators table if they do not exist
        if (Schema::hasTable('vessel_operators')) {
            Schema::table('vessel_operators', function (Blueprint $table) {
                if (!Schema::hasColumn('vessel_operators', 'status')) {
                    $table->enum('status', ['active', 'vetoed'])->default('active')->after('real_transporter_line');
                }
                if (!Schema::hasColumn('vessel_operators', 'veto_reason')) {
                    $table->text('veto_reason')->nullable()->after('status');
                }
                if (!Schema::hasColumn('vessel_operators', 'vetoed_at')) {
                    $table->timestamp('vetoed_at')->nullable()->after('veto_reason');
                }
                if (!Schema::hasColumn('vessel_operators', 'vetoed_by')) {
                    $table->unsignedBigInteger('vetoed_by')->nullable()->after('vetoed_at');
                    $table->foreign('vetoed_by')->references('id')->on('users')->nullOnDelete();
                }
                if (!Schema::hasColumn('vessel_operators', 'unveto_reason')) {
                    $table->text('unveto_reason')->nullable()->after('vetoed_by');
                }
                if (!Schema::hasColumn('vessel_operators', 'unvetoed_at')) {
                    $table->timestamp('unvetoed_at')->nullable()->after('unveto_reason');
                }
                if (!Schema::hasColumn('vessel_operators', 'unvetoed_by')) {
                    $table->unsignedBigInteger('unvetoed_by')->nullable()->after('unvetoed_at');
                    $table->foreign('unvetoed_by')->references('id')->on('users')->nullOnDelete();
                }
            });
        }

        // 4. Backfill existing vetoed exit operators into operator_veto_logs
        try {
            $existingVetoed = ExitOperator::where('status', 'vetoed')->get();
            foreach ($existingVetoed as $op) {
                $alreadyLogged = DB::table('operator_veto_logs')
                    ->where('operator_id', $op->id)
                    ->where('operator_type', ExitOperator::class)
                    ->where('action', 'vetoed')
                    ->exists();

                if (!$alreadyLogged) {
                    $vetoDate = $op->updated_at ?? Carbon::now();
                    $op->update([
                        'vetoed_at' => $vetoDate,
                        'vetoed_by' => $op->updated_by ?? 1,
                        'veto_reason' => 'Veto registrado previamente en sistema',
                    ]);

                    DB::table('operator_veto_logs')->insert([
                        'operator_id'     => $op->id,
                        'operator_type'   => ExitOperator::class,
                        'operator_name'   => $op->name,
                        'license'         => $op->license,
                        'tractor_plate'   => $op->tractor_plate,
                        'trailer_plate'   => $op->trailer_plate,
                        'transport_line'  => $op->transport_line,
                        'economic_number' => $op->economic_number,
                        'action'          => 'vetoed',
                        'reason'          => 'Veto registrado previamente en sistema',
                        'user_id'         => $op->updated_by ?? 1,
                        'created_at'      => $vetoDate,
                        'updated_at'      => $vetoDate,
                    ]);
                }
            }
        } catch (\Exception $e) {
            // Silently continue if backfill encounters an issue
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('operator_veto_logs');

        if (Schema::hasTable('exit_operators')) {
            Schema::table('exit_operators', function (Blueprint $table) {
                $table->dropForeign(['vetoed_by']);
                $table->dropForeign(['unvetoed_by']);
                $table->dropColumn(['veto_reason', 'vetoed_at', 'vetoed_by', 'unveto_reason', 'unvetoed_at', 'unvetoed_by']);
            });
        }

        if (Schema::hasTable('vessel_operators')) {
            Schema::table('vessel_operators', function (Blueprint $table) {
                $table->dropForeign(['vetoed_by']);
                $table->dropForeign(['unvetoed_by']);
                $table->dropColumn(['status', 'veto_reason', 'vetoed_at', 'vetoed_by', 'unveto_reason', 'unvetoed_at', 'unvetoed_by']);
            });
        }
    }
};
