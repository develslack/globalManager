/**
 * Global Manager - gm_register.js
 * Core User Registration Logic with Dynamic API Base URL & i18n
 */

const GMRegister = (function() {

    function init() {
        const formRegister = document.getElementById('form-register');
        if (formRegister) {
            formRegister.addEventListener('submit', handleRegisterSubmit);
        }

        if (typeof GMi18n !== 'undefined') {
            GMi18n.translateDOM();
        }
    }

    async function handleRegisterSubmit(e) {
        e.preventDefault();

        const nameInput = document.getElementById('input-register-name');
        const emailInput = document.getElementById('input-register-email');
        const pass1Input = document.getElementById('input-register-pass1');
        const pass2Input = document.getElementById('input-register-pass2');
        const alertBox = document.getElementById('register-alert');

        if (!nameInput || !emailInput || !pass1Input || !pass2Input) return;

        const name = encodeURIComponent(nameInput.value.trim());
        const email = encodeURIComponent(emailInput.value.trim());
        const password_1 = encodeURIComponent(pass1Input.value);
        const password_2 = encodeURIComponent(pass2Input.value);

        if (!name || !email || !password_1 || !password_2) {
            showError(alertBox, GMi18n.t('auth_register_empty_fields', 'Todos los campos son obligatorios.'));
            return;
        }

        if (pass1Input.value !== pass2Input.value) {
            showError(alertBox, GMi18n.t('auth_register_pass_mismatch', 'Las contraseñas no coinciden.'));
            return;
        }

        const payload = `name=${name}&email=${email}&password_1=${password_1}&password_2=${password_2}`;

        // URL base dinámica de la API
        const baseUrl = window.API_BASE_URL || '';

        try {
            const response = await fetch(`${baseUrl}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: payload
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {

                if (typeof LibCore !== 'undefined' && LibCore.toast) {
                    LibCore.toast(GMi18n.t('auth_register_success', 'Registro completado con éxito. Inicie sesión.'), 'success');
                }

                if (typeof CoreUI !== 'undefined' && typeof CoreUI.navigate === 'function') {
                    CoreUI.navigate('login');
                }

            } else {

                const errorMsg = result.message || GMi18n.t('auth_register_error', 'Error al procesar el registro.');
                showError(alertBox, errorMsg);
            }
        } catch (err) {
            console.error('[GM-Register] Server or network error:', err);
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
