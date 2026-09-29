import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ScaleProvider } from './Contexts/ScaleContext';

router.on('navigate', (event) => {
    const page = event.detail.page as any;
    if (page?.props?.csrf_token) {
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta) {
            meta.setAttribute('content', page.props.csrf_token);
        }
        if (window.axios?.defaults?.headers?.common) {
            window.axios.defaults.headers.common['X-CSRF-TOKEN'] = page.props.csrf_token;
        }
    }
});
// import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker
// Register PWA Service Worker with Auto-Update
/*
const updateSW = registerSW({
    immediate: true,
    onRegisterError(error) {
        console.error('SW registration error', error);
    },
});

// Poll for updates every 2 minutes
setInterval(() => {
    updateSW(true);
}, 2 * 60 * 1000);
*/

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ScaleProvider>
                <App {...props} />
            </ScaleProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
