// =========================================================================
// CONFIGURACIÓN DE ENTORNO (DEV vs PROD)
// =========================================================================
const isDev = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

window.API_BASE_URL = isDev ? 'http://localhost:5000' : '/api';

// Ruta dinámica para las vistas HTML
window.VIEWS_PATH = isDev ? '/views' : '';

console.log("🌐 Entorno detectado. URL Base de la API:", window.API_BASE_URL);

// =========================================================================
// INDICADOR VISUAL DE ENTORNO (FLOTANTE)
// =========================================================================
const envBadge = document.createElement("div");

envBadge.innerHTML = isDev
    ? '<span class="glyphicon glyphicon-wrench"></span> ENTORNO DESARROLLO'
    : '<span class="glyphicon glyphicon-globe"></span> ENTORNO PRODUCCIÓN';

envBadge.style.position = 'fixed';
envBadge.style.bottom = '15px';
envBadge.style.right = '15px';
envBadge.style.padding = '8px 15px';
envBadge.style.borderRadius = '20px';
envBadge.style.color = '#fff';
envBadge.style.backgroundColor = isDev ? '#d35400' : '#27ae60'; // Naranja Dev, Verde Prod
envBadge.style.zIndex = '9999';
envBadge.style.fontSize = '12px';
envBadge.style.fontWeight = 'bold';
envBadge.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
envBadge.style.pointerEvents = 'none';

document.body.appendChild(envBadge);

// =========================================================================
// CoreUI Base Handler
// =========================================================================
const CoreUI = (function() {
    let config = {
        viewContainerId: 'app-view',
        viewsFolder: 'frontend/templates/views/logic/components/',
        defaultView: 'login',
        baseRoute: '/'
    };

    let businessLogic = null;

    function init(userConfig = {}, appLogicModule = null) {
        config = Object.assign({}, config, userConfig);
        businessLogic = appLogicModule;

        cleanAddressBar();

        document.addEventListener('click', function(e) {
            const target = e.target.closest('[data-route]');
            if (target) {
                e.preventDefault();
                const viewName = target.getAttribute('data-route');
                navigateTo(viewName);
            }
        });

        window.addEventListener('popstate', function(e) {
            const viewName = (e.state && e.state.view) ? e.state.view : getRouteFromUrl() || config.defaultView;
            loadView(viewName, true);
        });

        const initialView = getRouteFromUrl() || config.defaultView;
        loadView(initialView, true);
    }

    function cleanAddressBar() {
        let path = window.location.pathname;
        if (path.endsWith('/index.html') || path === '/index') {
            history.replaceState({ view: config.defaultView }, '', config.baseRoute);
        }
    }

    function getRouteFromUrl() {
        let path = window.location.pathname.replace(/\.html$/, '');
        const cleanPath = path.replace(/^\/|\/$/g, '');
        if (!cleanPath || cleanPath === 'index') return null;
        return cleanPath;
    }

    function navigateTo(viewName) {
        const newUrl = (viewName === config.defaultView) ? config.baseRoute : `/${viewName}`;
        if (window.location.pathname !== newUrl) {
            history.pushState({ view: viewName }, '', newUrl);
        }
        loadView(viewName, true);
    }

    async function loadView(viewName, triggerHook = true) {
        const container = document.getElementById(config.viewContainerId);
        if (!container) return;

        try {
            const response = await fetch(`${config.viewsFolder}${viewName}.html`);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);

            const htmlContent = await response.text();
            container.innerHTML = htmlContent;

            if (triggerHook && businessLogic && typeof businessLogic.onViewLoaded === 'function') {
                businessLogic.onViewLoaded(viewName);
            }
        } catch (error) {
            console.error(`[CoreUI] Error loading view '${viewName}':`, error);
        }
    }

    function handoverToDashboard() {
        window.location.href = '/dashboard';
    }

    return {
        init: init,
        navigate: navigateTo,
        handoverToDashboard: handoverToDashboard
    };
})();
