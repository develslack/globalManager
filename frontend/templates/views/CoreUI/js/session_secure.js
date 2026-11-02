/**
 * chassisCore - session_secure.js
 * Módulo de seguridad, persistencia de toasts (min. 3s) y blindaje de navegación Sandbox.
 */
const SessionSecure = (function() {

    function isTokenValid() {
        const token = localStorage.getItem('gm_token');
        return token !== null && token !== '' && token !== 'undefined';
    }

    /**
     * Muestra notificaciones con duración mínima de 3 segundos
     */
    function notify(message, type = 'warning', title = 'Atención') {
        if (typeof LibCore !== 'undefined' && LibCore.toast) {
            // El último parámetro (3000 ms) asegura que el toast permanezca al menos 3s en pantalla
            LibCore.toast(message, type, title, 3000);
        } else {
            alert(message);
        }
    }

    /**
     * Trampa de Historial (History Lock)
     * Congela la navegación impidiendo que el usuario se mueva con las flechas Atrás/Adelante
     */
    function lockHistoryState() {
        history.pushState(null, document.title, window.location.href);
    }

    /**
     * Protección para la pantalla de Login (/)
     */
    function protectLogin() {
        // Si el usuario ya está autenticado e intenta volver a /, lo redirigimos al dashboard
        if (isTokenValid() && (window.location.pathname === '/' || window.location.pathname.endsWith('/index.html'))) {
            window.location.replace('/dashboard');
            return;
        }
        // Bloqueo de navegación Sandbox en Login
        lockHistoryState();
    }

    /**
     * Protección para el Dashboard (/dashboard)
     */
    function protectDashboard() {
        if (!isTokenValid()) {
            enforceLogout('Sesión caducada. Debe iniciar sesión nuevamente.');
            return;
        }
        // Bloqueo de navegación Sandbox en Dashboard
        lockHistoryState();
    }

    /**
     * Expulsión del sistema con aviso visible mínimo de 3 segundos
     */
    function enforceLogout(message) {
        localStorage.removeItem('gm_token');
        localStorage.removeItem('gm_user');
        sessionStorage.clear();

        if (message) {
            notify(message, 'warning', 'Acceso Restringido');
        }

        // Se da un tiempo de 3 segundos para que el aviso permanezca en pantalla antes de redirigir
        setTimeout(() => {
            window.location.replace('/');
        }, 3000);
    }

    /**
     * Cierre de sesión voluntario
     */
    function logout() {
        localStorage.removeItem('gm_token');
        localStorage.removeItem('gm_user');
        sessionStorage.clear();

        notify('Sesión cerrada correctamente.', 'info', 'Cierre de Sesión');

        setTimeout(() => {
            window.location.replace('/');
        }, 3000);
    }

    /**
     * Escuchador global de eventos de navegación (BFCache + PopState)
     */
    function initSandboxGuard() {
        // Intercepta clics en los botones Atrás / Adelante del navegador
        window.addEventListener('popstate', function(e) {
            const currentPath = window.location.pathname;

            if (currentPath.startsWith('/dashboard')) {
                if (!isTokenValid()) {
                    enforceLogout('Debe iniciar sesión para acceder al sistema.');
                } else {
                    // Mantener bloqueado el navegador dentro de /dashboard
                    lockHistoryState();
                }
            } else if (currentPath === '/' || currentPath.endsWith('/index.html')) {
                // Mantener bloqueado el navegador dentro de /
                lockHistoryState();
            }
        });

        // Intercepta restauración en memoria desde el caché (BFCache)
        window.addEventListener('pageshow', function(event) {
            const isRestoredFromCache = event.persisted ||
                (window.performance && window.performance.navigation && window.performance.navigation.type === 2);

            const isDashboard = window.location.pathname.startsWith('/dashboard');

            if (isDashboard && (!isTokenValid() || isRestoredFromCache)) {
                enforceLogout('Debe iniciar sesión para acceder al sistema.');
            }
        });
    }

    // Inicialización automática del guardián de navegación
    initSandboxGuard();

    return {
        protectDashboard: protectDashboard,
        protectLogin: protectLogin,
        logout: logout,
        notify: notify,
        isValid: isTokenValid
    };
})();
