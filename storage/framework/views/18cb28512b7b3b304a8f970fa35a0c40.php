<!DOCTYPE html>
<html lang="<?php echo e(str_replace('_', '-', app()->getLocale())); ?>">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="google" content="notranslate">
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">

    <title inertia><?php echo e(config('app.name', 'Laravel')); ?></title>
    <link rel="icon" type="image/png"
        href="<?php echo e(config('app.tenant.favicon') ? asset(config('app.tenant.favicon')) : asset('Proagro.png')); ?>">

    <!-- PWA Meta Tags -->
    <meta name="theme-color" content="#1e1b4b">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <!-- Fonts & Icons -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

    <link rel="manifest" href="<?php echo e(asset('build/manifest.webmanifest')); ?>">

    <script>
        (() => {
            const basePath = <?php echo json_encode(rtrim((string) (parse_url((string) config('app.url'), PHP_URL_PATH) ?: ''), '/')) ?>;
            const applicationPaths = /^(dashboard|sales|traffic|surveillance|documentation|scale|dock|apt|admin|clients|profile|login)(\/|$)/;

            const normalizeLinks = () => {
                document.querySelectorAll('a[href]').forEach((link) => {
                    if (link.origin !== window.location.origin) return;

                    const path = link.pathname.replace(/^\/+/, '');
                    if (path.startsWith(basePath.slice(1) + '/') || !applicationPaths.test(path)) return;

                    link.href = `${basePath}/${path}`;
                });

                if (basePath) {
                    document.querySelectorAll('img[src]').forEach((img) => {
                        const rawSrc = img.getAttribute('src');
                        if (!rawSrc || rawSrc.startsWith('http') || rawSrc.startsWith('data:') || rawSrc.startsWith('blob:') || rawSrc.startsWith('//')) return;
                        if (rawSrc.startsWith('/') && !rawSrc.startsWith(`${basePath}/`)) {
                            img.src = `${basePath}${rawSrc}`;
                        } else if (!rawSrc.startsWith('/') && !rawSrc.startsWith(basePath)) {
                            img.src = `${basePath}/${rawSrc}`;
                        }
                    });
                }
            };

            let normalizeTimeout;
            const debouncedNormalizeLinks = () => {
                clearTimeout(normalizeTimeout);
                normalizeTimeout = setTimeout(normalizeLinks, 100);
            };

            normalizeLinks();
            new MutationObserver(debouncedNormalizeLinks).observe(document.documentElement, {
                childList: true,
                subtree: true,
            });

            window.currentUserRoles = <?php echo json_encode(auth()->check() ? auth()->user()->getRoleNames() : [], 15, 512) ?>;

            const ensureProductionNavigation = () => {
                const currentPath = window.location.pathname.replace(/\/+$/, '');
                const aptPath = `${basePath}/apt`;
                const productionPath = `${basePath}/apt/production`;
                const userRoles = window.currentUserRoles || [];
                const isJefeOrAdmin = userRoles.includes('Jefe de Almacen') || userRoles.includes('Admin');
                const isAlmacenOnly = userRoles.includes('Almacen') && !isJefeOrAdmin;

                if (currentPath === aptPath) {
                    const grid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
                    if (!grid) return;

                    if (isAlmacenOnly) {
                        const allowedHrefs = [
                            `${basePath}/apt/production`,
                            `${basePath}/apt/scanner`,
                            `${basePath}/apt/status-unidades`,
                            `${basePath}/apt/oe-tracker`,
                            `${basePath}/apt/attendance`
                        ];
                        grid.querySelectorAll('a[href]').forEach((link) => {
                            const isAllowed = allowedHrefs.some((allowed) => link.href.includes(allowed));
                            if (!isAllowed) {
                                link.style.display = 'none';
                            }
                        });
                    }

                    return;
                }

                if (currentPath !== productionPath) return;

                const content = document.querySelector('.py-12 > .max-w-7xl');
                if (!content || content.querySelector('[data-production-page]')) return;

                const allSubmodules = [
                    ['Gestión de la producción', 'Control y seguimiento de la producción.', '/apt/production/hub', 'fa-industry', 'bg-green-50 text-green-600', 'hover:border-green-500'],
                    ['Gestión de proceso de embarques', 'Seguimiento de órdenes y procesos de embarque.', '/apt/shipment-process?from=production', 'fa-truck', 'bg-blue-50 text-blue-600', 'hover:border-blue-500'],
                    ['Gestión de inventarios', 'Control de existencias, producción diaria e inventario inicial de Urea Agrícola.', '/apt/inventory?from=production', 'fa-boxes-stacked', 'bg-purple-50 text-purple-600', 'hover:border-purple-500'],
                    ['Gestión de maquinarias', 'Registro y mantenimiento de maquinaria operativa.', '/apt/status?from=production', 'fa-wrench', 'bg-orange-50 text-orange-600', 'hover:border-orange-500'],
                    ['Gestión de equipos envasado', 'Control de equipos y unidades de envasado.', '/apt/status-unidades?from=production', 'fa-box', 'bg-yellow-50 text-yellow-600', 'hover:border-yellow-500'],
                    ['Gestión de equipos de seguridad', 'Administración y control de equipos de seguridad.', '/apt/scanner?from=production', 'fa-shield-halved', 'bg-slate-100 text-slate-600', 'hover:border-slate-500'],
                    ['Gestión prestadores de servicios', 'Control de asistencias de personal y contratistas (GLS-AP-FO-005).', '/apt/attendance', 'fa-users', 'bg-indigo-50 text-indigo-600', 'hover:border-indigo-500'],
                    ['Gestión de requerimientos', 'Registro y seguimiento de solicitudes operativas.', '/apt/status?from=production', 'fa-circle-exclamation', 'bg-cyan-50 text-cyan-600', 'hover:border-cyan-500'],
                ];

                const submodules = allSubmodules;

                content.innerHTML = `<div class="max-w-7xl mx-auto sm:px-6 lg:px-8" data-production-page="true"><div class="mb-8"><a href="${aptPath}" class="inline-flex items-center text-gray-500 hover:text-emerald-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-sm font-medium mb-5">&larr; Volver al menú APT</a><h2 class="text-3xl font-bold text-gray-900 mb-2">Gestión de almacenes</h2><p class="text-gray-600">Selecciona un submódulo para continuar.</p></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">${submodules.map(([name, description, href, icon, color, hover]) => `<a href="${basePath}${href}" class="group bg-white rounded-xl shadow-md border-2 border-transparent p-8 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl ${hover}"><div class="w-20 h-20 rounded-full flex items-center justify-center mb-6 text-3xl transition-transform group-hover:scale-110 ${color}"><i class="fa-solid ${icon}"></i></div><h3 class="text-xl font-bold text-gray-800 break-words w-full">${name}</h3><p class="text-gray-500 mt-2 text-sm">${description}</p></a>`).join('')}</div></div>`;
                normalizeLinks();
            };

            let productionTimeout;
            const watchProductionNavigation = () => {
                const updateProductionNavigation = () => {
                    clearTimeout(productionTimeout);
                    productionTimeout = setTimeout(ensureProductionNavigation, 100);
                };

                updateProductionNavigation();
                new MutationObserver(updateProductionNavigation).observe(document.body, {
                    childList: true,
                    subtree: true,
                });
            };

            if (document.body) {
                watchProductionNavigation();
            } else {
                document.addEventListener('DOMContentLoaded', watchProductionNavigation, { once: true });
            }

            document.addEventListener('click', (event) => {
                const link = event.target.closest?.('a');
                if (!link || link.origin !== window.location.origin) return;

                const path = link.pathname.replace(/^\/+/, '');
                const localPath = path.startsWith(basePath.slice(1) + '/')
                    ? path.slice(basePath.length)
                    : `/${path}`;
                const applicationPath = localPath.replace(/^\/+/, '');
                if (!applicationPaths.test(applicationPath)) return;

                const productionPage = `${basePath}/apt/production`;
                const productionSubmodule = new RegExp(`^${basePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/apt/(status|status-unidades|scanner|lots|inventory|oe-tracker|shipment-process|management|production/hub|attendance)(/|$)`);
                const cameFromProduction = new URLSearchParams(window.location.search).get('from') === 'production';
                const aptMenuPath = path === 'apt' || path === `${basePath.slice(1)}/apt`;
                if (cameFromProduction && productionSubmodule.test(window.location.pathname) && aptMenuPath) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    window.location.assign(productionPage);
                    return;
                }

                if (window.location.pathname.replace(/\/+$/, '') === productionPage && productionSubmodule.test(link.pathname)) {
                    const target = new URL(link.href, window.location.origin);
                    target.searchParams.set('from', 'production');
                    window.location.assign(`${target.pathname}${target.search}${target.hash}`);
                    return;
                }

                event.preventDefault();
                event.stopImmediatePropagation();
                window.location.assign(`${basePath}/${applicationPath}${link.search}${link.hash}`);
            }, true);

            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                    registrations.forEach((registration) => registration.unregister());
                });
            }
        })();
    </script>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />
    <!-- FontAwesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">

    <style>
        html,
        body,
        *,
        *::before,
        *::after {
            cursor: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAPzSURBVGhD7ddvaBtlGADwW6dIcrn8aTPL5e7eey/J0rTuj+Zyd7nYWTZBC4OBjDDFD/4ZzH/rbO6SNmnWxVVXlVUF8csYm5ulY/hl6wfBb6N2Vq26NVyaIdbRdnWZtritq5VCxyPRL+W++M1k7H5wX573eR54ed/nhSMIi8VisVgsFsv9a2LLFvIHUXzQHL9nTARxviCgLwt+7rMLm0LhCy0tDnNOTSsE8ImCH5UKCH8xhZnVSwKfHd282WPOq1kFjPp/CgrnC340UEK+uckAf+oPzN0ygmivObcmGZg9+Dtm7xT8aPz7R5r3XmHp8g3MLF8KCNlyILDn8tatbnNNTTGCXMAI4g+uCfjc5Y3+VyZZ+kYBcSeLHPsNCAiKPHveXFORSCTWm2NV8Xkisb7E+Zb+4lmY4ugFQ8CfToQC2hxiYJb1rZR4/u3rAb59JBymK/kNB1TJrcUGxH018nLlCaLO4PmcgfHAtB8NGEHh9R+bm5+8iTkwOPZYCTFDKwILMz7mYlhrDdlzypIjKR4196m6ScSM3UIMLPEMXEHMnIGRMSngd39mfTCPGLhGM5/UZaVhsl8FdyrWweitChCwztynKsZirK2E2NkZxKwWEXt2KoAHxzaF24wm/PQ8z8KvtO/2C8+Kr9ZlxLv2rASe9ONvuXT5uqsnVvBq8nNEPl9n7vm/mxCEUNHvf/EXjM5M8+jbqzw7OC4Iu6/yzPLCBnrcllbet/VKYO+RwKlJH1Ga9J3zcBxcGXWlQVd1giCqfxolnvsYBB5uIxZWK0PNs1DE6Kt5Gp0iemJn7T1RqHxkShzx7o9vc3dve+Lh7I7GYEe709yrKhY2MLtXGpnRcqNvaIZmTizT7PBiPZcDgnjAmZK+th+Mgr0rAqQWWQx2tD9krq++vu1NVLfcR/RKZ4hD0jkipwzR6dg7xJHWFm9SPUBmo0uVE3CkRfB2xiLm8qpBr7V63CnlOHUoBrYjKtgrdz0rgi0Xhcq9JzMiODPSaboz/jzVJV0k8wo4k6Js7lM1G5M7GJeuvOTult9wp+RjpB6ZInMy2LsjYNceBVvqsX82RXaLs15NftnZpZz2aq0hc5+qy+ehzqPLg950POlKye850mKZ7FXAnv337ldmgMxK0KjF95hra0JlMClNXHT2xaG+Q34KZXZ6PGlVp1LREYculh1J8TcyFb3jyEh3XbU0A2u5ktFRSo/ebErHqbXxlnzC0ZTeRTXsV8OOrPInlVGm/ftE19qcmuDW1F6Ppvab42vVJ2PPUIdVcOrisHmt6iovEv9m23/+AziT0oeuo23Q0KlkzGv3BABY59bV4w0d8e3mNYvFYrFYLBbLfeJvlaxaRdQ/lIsAAAAASUVORK5CYII=') 4 4, auto !important;
        }

        a,
        a *,
        button,
        button *,
        input,
        select,
        textarea,
        [role="button"],
        [role="button"] *,
        [role="tab"],
        [role="tab"] *,
        label,
        .cursor-pointer,
        .cursor-pointer * {
            cursor: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAPzSURBVGhD7ddvaBtlGADwW6dIcrn8aTPL5e7eey/J0rTuj+Zyd7nYWTZBC4OBjDDFD/4ZzH/rbO6SNmnWxVVXlVUF8csYm5ulY/hl6wfBb6N2Vq26NVyaIdbRdnWZtritq5VCxyPRL+W++M1k7H5wX573eR54ed/nhSMIi8VisVgsFsv9a2LLFvIHUXzQHL9nTARxviCgLwt+7rMLm0LhCy0tDnNOTSsE8ImCH5UKCH8xhZnVSwKfHd282WPOq1kFjPp/CgrnC340UEK+uckAf+oPzN0ygmivObcmGZg9+Dtm7xT8aPz7R5r3XmHp8g3MLF8KCNlyILDn8tatbnNNTTGCXMAI4g+uCfjc5Y3+VyZZ+kYBcSeLHPsNCAiKPHveXFORSCTWm2NV8Xkisb7E+Zb+4lmY4ugFQ8CfToQC2hxiYJb1rZR4/u3rAb59JBymK/kNB1TJrcUGxH018nLlCaLO4PmcgfHAtB8NGEHh9R+bm5+8iTkwOPZYCTFDKwILMz7mYlhrDdlzypIjKR4196m6ScSM3UIMLPEMXEHMnIGRMSngd39mfTCPGLhGM5/UZaVhsl8FdyrWweitChCwztynKsZirK2E2NkZxKwWEXt2KoAHxzaF24wm/PQ8z8KvtO/2C8+Kr9ZlxLv2rASe9ONvuXT5uqsnVvBq8nNEPl9n7vm/mxCEUNHvf/EXjM5M8+jbqzw7OC4Iu6/yzPLCBnrcllbet/VKYO+RwKlJH1Ga9J3zcBxcGXWlQVd1giCqfxolnvsYBB5uIxZWK0PNs1DE6Kt5Gp0iemJn7T1RqHxkShzx7o9vc3dve+Lh7I7GYEe709yrKhY2MLtXGpnRcqNvaIZmTizT7PBiPZcDgnjAmZK+th+Mgr0rAqQWWQx2tD9krq++vu1NVLfcR/RKZ4hD0jkipwzR6dg7xJHWFm9SPUBmo0uVE3CkRfB2xiLm8qpBr7V63CnlOHUoBrYjKtgrdz0rgi0Xhcq9JzMiODPSaboz/jzVJV0k8wo4k6Js7lM1G5M7GJeuvOTult9wp+RjpB6ZInMy2LsjYNceBVvqsX82RXaLs15NftnZpZz2aq0hc5+qy+ehzqPLg950POlKye850mKZ7FXAnv337ldmgMxK0KjF95hra0JlMClNXHT2xaG+Q34KZXZ6PGlVp1LREYculh1J8TcyFb3jyEh3XbU0A2u5ktFRSo/ebErHqbXxlnzC0ZTeRTXsV8OOrPInlVGm/ftE19qcmuDW1F6Ppvab42vVJ2PPUIdVcOrisHmt6iovEv9m23/+AziT0oeuo23Q0KlkzGv3BABY59bV4w0d8e3mNYvFYrFYLBbLfeJvlaxaRdQ/lIsAAAAASUVORK5CYII=') 4 4, pointer !important;
        }

        .sidebar-container,
        .sidebar-container * {
            cursor: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAICSURBVGhD7ddLqM5BGMdx1yTHbSVZqkOWCiskha0sTrJxWRBR2BAi5JJbyUZyj+ycs1C27pedlJWFJJdS7krRR0+eU2/TKTv//8l86635PzPz9DzvzPObmSFDKpVKpVKpVCr/LxiDkaV90IDduIlLmI6uckyrwVk8ww38xHZMLMe1FhxAL47iFS7gI9aUY1sJduILHkfQeIPvuRI9mFDOaRWYimO4jrV4i3N44A+95ZwAw0tbI0Qg+JrBvsd5bMnvH9iHJZic42fldmuHcmEYdmRQ8VuPhZnAaVzJ9l10Z7JHSj+Ng/sZaBDF/BQHO2yn0JftjZiDoaWfRsBovEwZvYbLmI/FGfAnrMOv/N6D13iC5bGKpc9/Tm6PlbiKh5nEslSkUKjDGXxwAo+yHXWytRWrgZMdQfZzO8+GWJl+bmEu5mESxpW+GiH/8TtZuHFCx56PAh+Bex0JfMaocn7jYBr25jaKcyES2Y8Z2NQht8HMcn5jxN0HZzqCG4iLWJFyGswu/TQGpmAVNqT2Py+C7yeUanUm0136aZw81EJ9NuNQ3osGoqec2wqiMLNAg0W5tUIiQ3UimXd58YvzoD010Emq0AeMLexdYctHzze8wPjOMa0Au+KNUNo7wdJcpb6yr3Fy2/z1DYDjmcS2sm9QEFeHlN4FZV+lUqlUKpVK5T/hN9f6MFBO/5D0AAAAAElFTkSuQmCC') 4 4, pointer !important;
        }
    </style>

    <!-- Scripts -->
    <?php echo app('Tighten\Ziggy\BladeRouteGenerator')->generate(); ?>
    <!-- Cache Buster: v=3.2-print-entry-clean -->
    <?php echo app('Illuminate\Foundation\Vite')->reactRefresh(); ?>
    <?php echo app('Illuminate\Foundation\Vite')('resources/js/app.tsx'); ?>
    <?php if (!isset($__inertiaSsrDispatched)) { $__inertiaSsrDispatched = true; $__inertiaSsrResponse = app(\Inertia\Ssr\Gateway::class)->dispatch($page); }  if ($__inertiaSsrResponse) { echo $__inertiaSsrResponse->head; } ?>
</head>

<body class="font-sans antialiased">
    <?php if (!isset($__inertiaSsrDispatched)) { $__inertiaSsrDispatched = true; $__inertiaSsrResponse = app(\Inertia\Ssr\Gateway::class)->dispatch($page); }  if ($__inertiaSsrResponse) { echo $__inertiaSsrResponse->body; } elseif (config('inertia.use_script_element_for_initial_page')) { ?><script data-page="app" type="application/json"><?php echo json_encode($page); ?></script><div id="app"></div><?php } else { ?><div id="app" data-page="<?php echo e(json_encode($page)); ?>"></div><?php } ?>
</body>

</html><?php /**PATH C:\xampp\htdocs\Proagroindustria2\resources\views/app.blade.php ENDPATH**/ ?>