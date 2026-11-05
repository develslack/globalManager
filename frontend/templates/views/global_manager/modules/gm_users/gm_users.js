// ================================================================================================= //
// MÓDULO GM_USERS - Lógica de vista "Usuarios" (Global Manager)
// ================================================================================================= //

const GM_USERS = (function() {
    let listenersAttached = false;

    /**
     * Punto de entrada invocado automáticamente por GMHandler al cargar la vista
     */
    async function init() {
        console.clear();
        console.log("✅ Inicializando módulo Global Manager: Usuarios...");

        attachGlobalListeners();
        await loadUsersList();
    }

    /**
     * Consulta al backend y renderizado de la tabla de usuarios
     */
    async function loadUsersList() {
        const tableBody = document.getElementById("usersTableBody");
        const alertInfo = document.getElementById("alert-info");

        if (!tableBody) return;

        try {
            if (typeof LibCore !== 'undefined') {
                LibCore.showLoader('dashboard-view', 'spinner', 'submit', 'Obteniendo registros de usuarios...');
            }

            const response = await fetch(window.API_BASE_URL + "/users/list");
            if (!response.ok) throw new Error("Error en la respuesta del servidor HTTP " + response.status);

            const usuarios = await response.json();

            tableBody.innerHTML = "";
            let count = 0;

            usuarios.forEach((u) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td class="text-center">${u.nombre}</td>
                    <td class="text-center">${u.email}</td>
                    <td class="text-center">${u.rol}</td>
                    <td class="text-center">
                      <button class="btn btn-warning btn-sm btn-editar-rol" data-id="${u.id}">
                        <span class="glyphicon glyphicon-edit"></span> Editar Rol
                      </button>
                    </td>`;
                tableBody.appendChild(row);
                count++;
            });

            // Actualizar motor de tablas agnóstico apuntando al ID de la tabla en el HTML
            if (typeof CoreTable !== 'undefined') {
                CoreTable.update('usersTable');
            }

            if (alertInfo) {
                alertInfo.innerHTML = `
                    <div class="alert alert-info">
                        <span class="glyphicon glyphicon-option-vertical" aria-hidden="true"></span>
                        <strong>Cantidad de Registros: </strong> ${count}
                    </div><hr>`;
            }
            console.log(`📊 Total de usuarios cargados: ${count}`);

        } catch (error) {
            console.error("💥 Error al obtener usuarios:", error);
            if (alertInfo) {
                alertInfo.innerHTML = `<div class="alert alert-danger">Error al cargar los usuarios. Verifique conexión.</div>`;
            }
        } finally {
            if (typeof LibCore !== 'undefined') {
                LibCore.hideLoader('dashboard-view');
            }
        }
    }

    /**
     * Escuchador de eventos delegado
     */
    function attachGlobalListeners() {
        if (listenersAttached) return;
        listenersAttached = true;

        document.addEventListener("click", async (e) => {
            // 1. Clic en botón "Añadir Usuario"
            const btnNewUser = e.target.closest("#btn-add-user, [data-action='new-user']");
            if (btnNewUser) {
                e.preventDefault();
                await openNewUserModal();
                return;
            }

            // 2. Capturar clics sobre botones de edición de rol
            const btnEdit = e.target.closest(".btn-editar-rol");
            if (btnEdit) {
                e.preventDefault();
                const userId = btnEdit.dataset.id;
                console.log("🧩 Solicitud de edición de rol para usuario ID:", userId);
            }
        });
    }

    /**
     * Carga asíncrona del modal parcial de alta y apertura mediante LibCore
     */
    async function openNewUserModal() {
        console.log("📂 Solicitando modal de alta de usuario...");

        // 1. Contenedor temporal con ID único (evita colisión con el ID del modal interno)
        let modalContainer = document.getElementById("modal-container-dynamic");
        if (!modalContainer) {
            modalContainer = document.createElement("div");
            modalContainer.id = "modal-container-dynamic";
            document.body.appendChild(modalContainer);
        }

        try {
            // Cargar la plantilla HTML del modal
            const response = await fetch(`${configFolder()}/new_user.html`);
            if (!response.ok) throw new Error("No se pudo cargar la vista del modal de alta.");

            const htmlContent = await response.text();
            modalContainer.innerHTML = htmlContent;

            // 2. Poblar el selector de roles del formulario
            await loadRoles("select-new-user-rol");

            // 3. Abrir el modal apuntando a su ID real (<div id="modal-new_user" class="modal-backdrop">)
            if (typeof LibCore !== 'undefined') {
                LibCore.openModal("modal-new_user");
            }

            // 4. Activar eventos de submit del formulario
            initNewUserFormListeners();

        } catch (error) {
            console.error("💥 Error al abrir el modal de usuario:", error);
            if (typeof LibCore !== 'undefined') {
                LibCore.toast("Error al cargar el formulario de alta.", "danger", "Atención");
            }
        }
    }

    /**
     * Helper para obtener la ruta base del módulo
     */
    function configFolder() {
        return 'views/global_manager/modules/gm_users';
    }

    /**
     * Consulta el catálogo de roles y puebla un elemento SELECT
     */
    async function loadRoles(selectId, currentRoleId = null) {
        const select = document.getElementById(selectId);
        if (!select) return false;

        try {
            const response = await fetch(window.API_BASE_URL + "/roles/list");
            const roles = await response.json();

            select.innerHTML = '<option value="" disabled selected>Seleccione un Rol</option>';

            roles.forEach(rol => {
                const option = document.createElement("option");
                option.value = rol.id;
                option.textContent = rol.descripcion;

                if (currentRoleId && rol.id == currentRoleId) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
            return true;
        } catch (error) {
            console.error("❌ Error al cargar roles:", error);
            return false;
        }
    }

    /**
     * Configuración del envío del formulario de alta al backend
     */
    function initNewUserFormListeners() {
        const form = document.getElementById("form-new_user");
        if (!form) return;

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            console.log("📨 Enviando datos de nuevo usuario al backend...");

            const formData = new URLSearchParams(new FormData(form));

            try {
                if (typeof LibCore !== 'undefined') {
                    LibCore.showLoader('modal-new_user', 'spinner', 'submit', 'Registrando usuario...');
                }

                const res = await fetch(window.API_BASE_URL + "/users/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: formData.toString()
                });

                const result = await res.json();

                if (result.status === "ok" || res.ok) {
                    if (typeof LibCore !== 'undefined') {
                        LibCore.toast(result.message || "Usuario registrado exitosamente.", "success", "Éxito");
                        LibCore.closeModal("modal-new_user");
                    }
                    await loadUsersList();
                } else {
                    if (typeof LibCore !== 'undefined') {
                        LibCore.toast(result.message || "Error en el registro.", "danger", "Validación");
                    }
                }
            } catch (err) {
                console.error("Error en petición de alta:", err);
                if (typeof LibCore !== 'undefined') {
                    LibCore.toast("Error de conexión al registrar usuario.", "danger", "Error crítico");
                }
            } finally {
                if (typeof LibCore !== 'undefined') {
                    LibCore.hideLoader('modal-new_user');
                }
            }
        });
    }

    return {
        init: init
    };

})();

window.GM_USERS = GM_USERS;
