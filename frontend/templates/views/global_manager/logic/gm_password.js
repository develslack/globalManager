/**
 * Global Manager - gm_password.js
 * Core Password Reset Logic with Dynamic API Base URL & i18n
 */

const GMPassword = (function() {

    function init() {
        const formPassword = document.getElementById('form-password');
        if (formPassword) {
            formPassword.addEventListener('submit', handlePasswordSubmit);
        }

        if (typeof GMi18n !== 'undefined') {
            GMi18n.translateDOM();
        }
    }

    async function handlePasswordSubmit(e) {
        e.preventDefault();

        const emailInput = document.getElementById('email');
        const pass1Input = document.getElementById('pass_1');
        const pass2Input = document.getElementById('pass_2');
        const alertBox = document.getElementById('password-alert');

        if (!emailInput || !pass1Input || !pass2Input) return;

        const email = encodeURIComponent(emailInput.value.trim());
        const pass1 = encodeURIComponent(pass1Input.value);
        const pass2 = encodeURIComponent(pass2Input.value);

        if (!email || !pass1 || !pass2) {
            showError(alertBox, GMi18n.t('auth_register_empty_fields', 'Todos los campos son obligatorios.'));
            return;
        }

        if (pass1Input.value !== pass2Input.value) {
            showError(alertBox, GMi18n.t('auth_register_pass_mismatch', 'Las contraseñas no coinciden.'));
            return;
        }

        const payload = `email=${email}&password_1=${pass1}&password_2=${pass2}`;

        // URL base dinámica de la API
        const baseUrl = window.API_BASE_URL || '';

        try {
            const response = await fetch(`${baseUrl}/password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: payload
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                if (typeof LibCore !== 'undefined' && LibCore.toast) {
                    LibCore.toast(GMi18n.t('auth_recovery_success', 'Contraseña actualizada correctamente.'), 'success');
                }

                if (typeof CoreUI !== 'undefined' && typeof CoreUI.navigate === 'function') {
                    CoreUI.navigate('login');
                }
            } else {
                const errorMsg = result.message || GMi18n.t('auth_recovery_error', 'No se pudo actualizar la contraseña.');
                showError(alertBox, errorMsg);
            }
        } catch (err) {
            console.error('[GM-Password] Server or network error:', err);
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
