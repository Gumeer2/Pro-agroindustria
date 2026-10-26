<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (config('app.env') === 'production' || str_starts_with((string)config('app.url'), 'https://') || request()->server('HTTP_X_FORWARDED_PROTO') === 'https') {
            URL::forceScheme('https');
        }

        if (config('app.url')) {
            $configuredHost = parse_url(config('app.url'), PHP_URL_HOST);
            $currentHost = !app()->runningInConsole() ? request()->getHost() : null;
            
            // If accessed from a live domain but APP_URL in .env was still localhost, do not break the domain!
            if ($currentHost && $configuredHost === 'localhost' && $currentHost !== 'localhost' && $currentHost !== '127.0.0.1') {
                // Use the live domain automatically
            } else {
                URL::forceRootUrl(rtrim(config('app.url'), '/'));
            }
        }

        Vite::prefetch(concurrency: 3);
    }
}
