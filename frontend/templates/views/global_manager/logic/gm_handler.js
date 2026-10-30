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
// Global Manager Handler
// =========================================================================
const GMHandler = (function() {
    let config = {
        viewContainerId: 'dashboard-view',
        modulesFolder: 'frontend/templates/views/global_manager/modules/',
        defaultView: 'gm_users',
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
        if (path.endsWith('/gm_dashboard.html') || path.endsWith('/dashboard.html')) {
            history.replaceState({ view: config.defaultView }, '', config.baseRoute);
        }
    }

    function navigateTo(viewName) {
        sessionStorage.setItem('gm_current_view', viewName);
        loadModule(viewName);
    }

    async function loadModule(moduleName) {
        const container = document.getElementById(config.viewContainerId);
        if (!container) return;

        try {
            const response = await fetch(`${config.modulesFolder}${moduleName}/${moduleName}.html`);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);

            const htmlContent = await response.text();
            container.innerHTML = htmlContent;

            await loadModuleScript(moduleName);

            updateActiveNavLinks(moduleName);

            if (typeof GMi18n !== 'undefined') {
                GMi18n.translateDOM();
            }
        } catch (error) {
            console.error(`[GMHandler] Error loading module '${moduleName}':`, error);
            const errorMsg = (typeof GMi18n !== 'undefined') ? GMi18n.t('ui_module_load_error', 'Error al cargar el módulo.') : 'Error loading module.';
            container.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
        }
    }

    function loadModuleScript(moduleName) {
        return new Promise((resolve) => {
            const scriptId = `script-mod-${moduleName}`;
            const scriptPath = `${config.modulesFolder}${moduleName}/${moduleName}.js`;

            if (loadedScripts.has(moduleName) || document.getElementById(scriptId)) {
                const moduleObjName = moduleName.toUpperCase();
                if (window[moduleObjName] && typeof window[moduleObjName].init === 'function') {
                    window[moduleObjName].init();
                }
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.id = scriptId;
            script.src = scriptPath;
            script.onload = () => {
                loadedScripts.add(moduleName);
                console.log(`[GMHandler] Dynamic JS loaded: ${scriptPath}`);
                resolve();
            };
            script.onerror = () => {
                console.warn(`[GMHandler] No script found for module: ${moduleName}`);
                resolve();
            };

            document.body.appendChild(script);
        });
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
        localStorage.removeItem('gm_token');
        localStorage.removeItem('gm_user');
        sessionStorage.removeItem('gm_current_view');
        window.location.href = '/';
    }

    return {
        init: init,
        navigate: navigateTo,
        logout: logout
    };
})();
