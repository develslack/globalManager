// ================================================================================================= //
// MÓDULO GM_USERS - Lógica de vista "Usuarios"
// ================================================================================================= //

const GM_USERS = (function() {
    let listenersAttached = false;

    /**
     * Punto de entrada invocado automáticamente por GMHandler al cargar la vista
     */
    async function init() {
        console.clear();
        console.log("✅ Inicializando módulo Usuarios...");

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
            // Activar loader bloqueando el visor principal
            if (typeof LibCore !== 'undefined') {
                LibCore.showLoader('dashboard-view', 'spinner', 'submit', 'Obteniendo registros...');
            }

            const response = await fetch(window.API_BASE_URL + "/users/list");
            if (!response.ok) throw new Error("Error en la respuesta del servidor HTTP " + response.status);

            const usuarios = await response.json();

            tableBody.innerHTML = "";
            let count = 0;

            usuarios.forEach((u) => {
                const row = document.createElement("tr");
                // Se utiliza class="btn-editar-rol" en lugar de un ID repetido
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

            // NUEVO: Avisar al motor agnóstico que la tabla ya tiene datos nuevos
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
            // Liberar la pantalla siempre al finalizar
            if (typeof LibCore !== 'undefined') {
                LibCore.hideLoader('dashboard-view');
            }
        }
    }

    /**
     * Escuchador de eventos delegado (se ejecuta 1 sola vez en la vida útil de la app)
     */
    function attachGlobalListeners() {
        if (listenersAttached) return;
        listenersAttached = true;

        document.addEventListener("click", async (e) => {
            // Capturar clics sobre botones de edición generados dinámicamente
            const btn = e.target.closest(".btn-editar-rol");
            if (!btn) return;

            e.preventDefault();
            const userId = btn.dataset.id;
            console.log("🧩 Solicitud de edición de rol para usuario ID:", userId);

            // Bloquear interfaz mientras se transiciona a la vista del formulario
            if (typeof LibCore !== 'undefined') {
                LibCore.showLoader('dashboard-view', 'spinner', 'warning', 'Cargando panel de edición...');
            }

            try {
                // NOTA: Si en el futuro actualizas esta vista a componente estanco nativo, usarás:
                // GMHandler.navigate('gm_rol_usuario');
                if (typeof loadDashboardView === 'function') {
                    await loadDashboardView(window.VIEWS_PATH + "/rol_usuario.html");
                }

                // Ejecuta la consulta de datos para poblar el formulario
                await loadUserRolForm(userId);
            } catch (error) {
                console.error("Error al transicionar de vista:", error);
                if (typeof LibCore !== 'undefined') LibCore.hideLoader('dashboard-view');
            }
        });
    }

    /**
     * Consulta el rol actual y configura el formulario de actualización
     */
    async function loadUserRolForm(userId) {
        console.log("🔍 Iniciando configuración de edición para ID:", userId);

        try {
            // Mantener un loader en el formulario
            if (typeof LibCore !== 'undefined') {
                LibCore.showLoader('dashboard-view', 'hourglass', 'info', 'Consultando base de datos...');
            }

            const response = await fetch(window.API_BASE_URL + "/users/get-role", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `id=${userId}`
            });

            if (!response.ok) throw new Error("Error al obtener el rol del usuario");

            const data = await response.json();
            console.log("📦 Rol actual detectado:", data.rol);

            // Poblar el SELECT
            await loadRoles("rol", data.rol_id || data.rol);

            const form = document.getElementById("form-user-rol");
            if (form) {
                document.getElementById("id_usuario").value = userId;

                form.addEventListener("submit", async (e) => {
                    e.preventDefault();

                    // Loader durante la escritura en base de datos
                    if (typeof LibCore !== 'undefined') {
                        LibCore.showLoader('dashboard-view', 'spinner', 'submit', 'Actualizando credenciales...');
                    }

                    const formData = new FormData(form);
                    const id = formData.get("id");
                    const rolId = formData.get("rol");

                    try {
                        const res = await fetch(window.API_BASE_URL + "/users/update-role", {
                            method: "POST",
                            headers: { "Content-Type": "application/x-www-form-urlencoded" },
                            body: `id=${encodeURIComponent(id)}&rol=${encodeURIComponent(rolId)}`
                        });

                        const result = await res.json();
                        const msgDiv = document.getElementById('msg-update-rol');

                        if (result.status === "ok") {
                            if(msgDiv) {
                                msgDiv.innerHTML = `<br><div class="alert alert-success alert-dismissible">
                                    <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>
                                    <p align=center><span class="glyphicon glyphicon-ok" aria-hidden="true"></span> ${result.message}</p>
                                </div>`;
                            }

                            setTimeout(function() { $(".close").click(); }, 3000);
                            setTimeout(function() {
                                if (typeof loadDashboardView === 'function') {
                                    loadDashboardView(window.VIEWS_PATH + "/usuarios.html");
                                }
                            }, 4000);

                        } else {
                            if(msgDiv) {
                                msgDiv.innerHTML = `<br><div class="alert alert-danger alert-dismissible">
                                    <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>
                                    <p align=center><span class="glyphicon glyphicon-warning-sign" aria-hidden="true"></span> ${result.message}</p>
                                </div>`;
                            }
                            setTimeout(function() { $(".close").click(); }, 3000);
                        }
                    } catch (err) {
                        console.error("Error al actualizar:", err);
                    } finally {
                        if (typeof LibCore !== 'undefined') LibCore.hideLoader('dashboard-view');
                    }
                });
            }
        } catch (err) {
            console.error("💥 Error en el flujo de roles:", err);
        } finally {
            if (typeof LibCore !== 'undefined') LibCore.hideLoader('dashboard-view');
        }
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

            select.innerHTML = '<option value="" disabled>Seleccione un Rol</option>';

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

    // Exponer el constructor al objeto global para que gm_handler lo localice
    return {
        init: init
    };

})();

// Adjuntar el objeto al contexto Window para que el enrutador "GMHandler" detecte window["GM_USERS"].init()
window.GM_USERS = GM_USERS;
