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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'username')) {
                $table->string('username')->unique()->after('name')->nullable();
            }
            $table->string('email')->nullable()->change(); // Make email nullable
        });

        // Populate username for existing users (using email prefix)
        if (config('database.default') === 'mysql') {
            DB::statement("UPDATE users SET username = SUBSTRING_INDEX(email, '@', 1) WHERE username IS NULL");
        } else {
            DB::table('users')->whereNull('username')->get()->each(function ($user) {
                if ($user->email) {
                    $username = explode('@', $user->email)[0];
                    DB::table('users')->where('id', $user->id)->update(['username' => $username]);
                }
            });
        }

        // Make username required after population
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('username');
            $table->string('email')->nullable(false)->change();
        });
    }
};
