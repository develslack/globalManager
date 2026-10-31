/**
 * Global Manager - gm_login.js
 * Core Login Logic with Dynamic API Base URL & i18n
 */

console.log("Module login load...");

const GMLogin = (function() {

    function init() {
        const formLogin = document.getElementById('form-login');
        if (formLogin) {
            formLogin.addEventListener('submit', handleLoginSubmit);
        }

        if (typeof GMi18n !== 'undefined') {
            GMi18n.translateDOM();
        }
    }

    async function handleLoginSubmit(e) {
        e.preventDefault();

        const emailInput = document.getElementById('input-email');
        const passwordInput = document.getElementById('input-password');
        const alertBox = document.getElementById('login-alert');

        if (!emailInput || !passwordInput) return;

        const email = encodeURIComponent(emailInput.value.trim());
        const password = encodeURIComponent(passwordInput.value);

        const payload = `email=${email}&password=${password}`;

        // URL base dinámica de la API
        const baseUrl = window.API_BASE_URL || '';

        try {
            const response = await fetch(`${baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: payload
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                localStorage.setItem('gm_token', result.user.token);
                localStorage.setItem('gm_user', JSON.stringify(result.user));

                if (typeof LibCore !== 'undefined' && LibCore.toast) {
                    LibCore.toast(GMi18n.t('auth_login_success', 'Autenticación exitosa. Redirigiendo...'), 'success');
                }

                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 2000);
            } else {
                const errorMsg = result.message || GMi18n.t('auth_login_error_credentials', 'Las credenciales ingresadas son incorrectas.');
                showError(alertBox, errorMsg);
            }
        } catch (err) {
            console.error('[GM-Login] Server or network error:', err);
            showError(alertBox, GMi18n.t('auth_login_error_server', 'No se pudo conectar con el servidor backend.'));
        }
    }

    function showError(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        } else if (typeof LibCore !== 'undefined' && LibCore.toast) {
            LibCore.toast(message, 'danger');
        }
    }

    return {
        init: init
    };
})();
