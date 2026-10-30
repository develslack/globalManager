/**
 * chassisCore / Global Manager - logic.js
 * Enrutador y cargador troncal de eventos para la interfaz de acceso (index.html).
 */

const AppLogic = (function() {

    function onViewLoaded(viewName) {
        console.log(`[AppLogic] Vista inyectada en index: '${viewName}'`);

        switch (viewName) {
            case 'login':
                // Invoca la lógica declarada en /global_manager/logic/gm_login.js
                if (typeof GMLogin !== 'undefined' && typeof GMLogin.init === 'function') {
                    GMLogin.init();
                } else {
                    console.warn('[AppLogic] El módulo GMLogin no está cargado en el contexto global.');
                }
                break;

            case 'registro':
            case 'register':
                if (typeof GMRegister !== 'undefined' && typeof GMRegister.init === 'function') {
                    GMRegister.init();
                }
                break;

            case 'recupero':
            case 'password':
                if (typeof GMPassword !== 'undefined' && typeof GMPassword.init === 'function') {
                    GMPassword.init();
                }
                break;

            default:
                console.log(`[AppLogic] No hay manejador específico asignado para '${viewName}'.`);
                break;
        }
    }

    return {
        onViewLoaded: onViewLoaded
    };
})();
