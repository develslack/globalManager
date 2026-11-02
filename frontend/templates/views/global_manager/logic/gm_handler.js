// =========================================================================
// CONFIGURACIÓN DE ENTORNO (DEV vs PROD)
// =========================================================================
const isDev = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

window.API_BASE_URL = isDev ? 'http://localhost:5000' : '/api';
window.VIEWS_PATH = isDev ? '/views' : '';

console.log("🌐 Entorno GM detectado. URL Base de la API:", window.API_BASE_URL);

// =========================================================================
// INDICADOR VISUAL DE ENTORNO (FLOTANTE)
// =========================================================================
if (!document.querySelector('.gm-env-badge')) {
    const envBadge = document.createElement("div");
    envBadge.className = 'gm-env-badge';
    envBadge.innerHTML = isDev
        ? '<span class="glyphicon glyphicon-wrench"></span> ENTORNO DESARROLLO'
        : '<span class="glyphicon glyphicon-globe"></span> ENTORNO PRODUCCIÓN';

    envBadge.style.position = 'fixed';
    envBadge.style.bottom = '15px';
    envBadge.style.right = '15px';
    envBadge.style.padding = '8px 15px';
    envBadge.style.borderRadius = '20px';
    envBadge.style.color = '#fff';
    envBadge.style.backgroundColor = isDev ? '#d35400' : '#27ae60';
    envBadge.style.zIndex = '9999';
    envBadge.style.fontSize = '12px';
    envBadge.style.fontWeight = 'bold';
    envBadge.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
    envBadge.style.pointerEvents = 'none';

    document.body.appendChild(envBadge);
}

// =========================================================================
// Global Manager Sandbox Handler
// =========================================================================
const GMHandler = (function() {
    let config = {
        viewContainerId: 'dashboard-view',
        modulesFolder: 'views/global_manager/modules/',
        defaultView: 'gm_home',
        fallbackView: 'gm_not_available',
        baseRoute: '/dashboard'
    };

    const loadedScripts = new Set();

    function init(userConfig = {}) {
        config = Object.assign({}, config, userConfig);

        if (!localStorage.getItem('gm_token')) {
            logout();
            return;
        }

        cleanAddressBar();

        document.addEventListener('click', function(e) {
            const target = e.target.closest('[data-route]');
            if (target) {
                e.preventDefault();
                const viewName = target.getAttribute('data-route');
                navigateTo(viewName);
            }

            const logoutBtn = e.target.closest('#btn-logout, [data-action="logout"]');
            if (logoutBtn) {
                e.preventDefault();
                logout();
            }
        });

        window.addEventListener('popstate', function() {
            const savedView = sessionStorage.getItem('gm_current_view') || config.defaultView;
            loadModule(savedView);
        });

        const initialView = sessionStorage.getItem('gm_current_view') || config.defaultView;
        loadModule(initialView);
    }

    function cleanAddressBar() {
        let path = window.location.pathname;
        if (path.endsWith('/dashboard.html') || path.endsWith('/gm_dashboard.html')) {
            history.replaceState({ view: config.defaultView }, '', config.baseRoute);
        }
    }

    function navigateTo(viewName) {
        sessionStorage.setItem('gm_current_view', viewName);
        loadModule(viewName);
    }

    /**
     * Carga de módulos según tu lógica:
     * ¿Existe el módulo solicitado? -> Cargar HTML y su JS.
     * ¿No existe? -> Cargar 'gm_not_available'.
     */
    async function loadModule(moduleName) {
        const container = document.getElementById(config.viewContainerId);
        if (!container) return;

        let targetView = moduleName;

        // 1. Verificar si existe la plantilla HTML del módulo solicitado
        let response = await fetch(`${config.modulesFolder}${targetView}/${targetView}.html`);

        // 2. Si no existe (404), derivar directamente al módulo 'gm_not_available'
        if (!response.ok && targetView !== config.fallbackView) {
            console.warn(`[GMHandler] Submódulo '${targetView}' no existe en disco. Cargando '${config.fallbackView}'...`);
            targetView = config.fallbackView;
            response = await fetch(`${config.modulesFolder}${targetView}/${targetView}.html`);
        }

        // 3. Renderizar la plantilla devuelta (sea la solicitada o el fallback)
        if (response.ok) {
            const htmlContent = await response.text();
            container.innerHTML = htmlContent;

            sessionStorage.setItem('gm_current_view', moduleName);

            // Carga no bloqueante del JS del módulo (si no existe el .js, no destruye la vista)
            loadModuleScript(targetView);

            updateActiveNavLinks(moduleName);

            if (typeof GMi18n !== 'undefined') {
                GMi18n.translateDOM();
            }
        }
    }

    /**
     * Carga segura del JS estanco del módulo
     */
    function loadModuleScript(moduleName) {
        const scriptId = `script-mod-${moduleName}`;
        const scriptPath = `${config.modulesFolder}${moduleName}/${moduleName}.js`;

        if (loadedScripts.has(moduleName) || document.getElementById(scriptId)) {
            const moduleObjName = moduleName.toUpperCase();
            if (window[moduleObjName] && typeof window[moduleObjName].init === 'function') {
                window[moduleObjName].init();
            }
            return;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = scriptPath;
        script.onload = () => {
            loadedScripts.add(moduleName);
            console.log(`[GMHandler] JS dinámico cargado con éxito: ${scriptPath}`);
        };
        script.onerror = () => {
            // Silenciar el error 404 del script opcional para que no aborte la renderización del HTML
            console.info(`[GMHandler] El módulo '${moduleName}' se renderizó solo con plantilla HTML (sin script .js).`);
        };

        document.body.appendChild(script);
    }

    function updateActiveNavLinks(moduleName) {
        document.querySelectorAll('[data-route]').forEach(link => {
            if (link.getAttribute('data-route') === moduleName) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    function logout() {
        if (typeof SessionSecure !== 'undefined' && typeof SessionSecure.logout === 'function') {
            SessionSecure.logout(true);
        } else {
            localStorage.removeItem('gm_token');
            localStorage.removeItem('gm_user');
            sessionStorage.clear();
            window.location.replace('/');
        }
    }

    return {
        init: init,
        navigate: navigateTo,
        logout: logout
    };
})();
