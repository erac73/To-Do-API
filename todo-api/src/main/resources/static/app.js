(() => {
  "use strict";

  const API_TASKS = "/api/tasks";
  const API_ROLES = "/api/roles";

  // DOM
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const sidebar = $("#sidebar");
  const menuToggle = $("#menu-toggle");
  const navItems = $$(".nav-item");
  const views = $$(".view");
  const pageTitle = $("#page-title");
  const addBtn = $("#add-btn");

  // Tasks
  const taskList = $("#task-list");
  const emptyTasks = $("#empty-tasks");
  const searchInput = $("#search-input");
  const filterBtns = $$(".filter-chip");
  const roleFilterBar = $("#role-filter-bar");
  const taskDialog = $("#task-dialog");
  const taskForm = $("#task-form");
  const taskCancel = $("#task-cancel");

  // Roles
  const rolesGrid = $("#roles-grid");
  const emptyRoles = $("#empty-roles");
  const roleDialog = $("#role-dialog");
  const roleForm = $("#role-form");
  const roleCancel = $("#role-cancel");

  // Stats
  const statTotal = $("#stat-total");
  const statDone = $("#stat-done");

  // State
  let allTasks = [];
  let allRoles = [];
  let currentFilter = "all";
  let currentRoleFilter = "all";
  let currentView = "tasks";
  let debounceTimer = null;

  // ── API ──────────────────────────────────────────────────────

  async function api(url, opts = {}) {
    try {
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...opts,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || body.error || `Error ${res.status}`);
      }
      if (res.status === 204) return null;
      return res.json();
    } catch (err) {
      toast(err.message, "error");
      throw err;
    }
  }

  // ── Load ─────────────────────────────────────────────────────

  async function loadAll() {
    const [tasks, roles] = await Promise.all([api(API_TASKS), api(`${API_ROLES}?activeOnly=true`)]);
    allTasks = tasks;
    allRoles = roles;
    renderAll();
  }

  function renderAll() {
    renderTasks();
    renderRoles();
    renderRoleFilter();
    renderRoleSelect();
    updateStats();
  }

  // ── Tasks ────────────────────────────────────────────────────

  function renderTasks() {
    const q = searchInput.value.trim().toLowerCase();
    let filtered = allTasks;

    if (currentFilter === "pending") filtered = filtered.filter((t) => !t.completed);
    else if (currentFilter === "completed") filtered = filtered.filter((t) => t.completed);

    if (currentRoleFilter !== "all") {
      filtered = filtered.filter((t) => t.roleId === Number(currentRoleFilter));
    }

    if (q) filtered = filtered.filter((t) => t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q));

    taskList.innerHTML = "";
    emptyTasks.hidden = filtered.length > 0;

    filtered.forEach((t) => taskList.appendChild(createTaskEl(t)));
  }

  function createTaskEl(t) {
    const li = document.createElement("li");
    li.className = `task-card${t.completed ? " done" : ""}`;
    li.innerHTML = `
      <button class="task-check" role="checkbox" aria-checked="${t.completed}"
        aria-label="${t.completed ? "Marcar pendiente" : "Marcar completada"}"
        title="${t.completed ? "Marcar pendiente" : "Marcar completada"}"></button>
      <div class="task-body">
        <div class="task-title">${esc(t.title)}</div>
        ${t.description ? `<div class="task-desc">${esc(t.description)}</div>` : ""}
        <div class="task-meta">
          <span class="priority priority-${t.priority}">${labelP(t.priority)}</span>
          ${t.roleName ? `<span class="role-badge">${esc(t.roleName)}</span>` : ""}
          <span class="task-date">${fmtDate(t.createdAt)}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="btn-icon edit" aria-label="Editar" title="Editar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
        </button>
        <button class="btn-icon danger delete" aria-label="Eliminar" title="Eliminar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V3h4v1M5 4v9h6V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>`;

    li.querySelector(".task-check").addEventListener("click", () => toggleTask(t.id));
    li.querySelector(".edit").addEventListener("click", () => openTaskDialog(t));
    li.querySelector(".delete").addEventListener("click", () => deleteTask(t.id));
    return li;
  }

  async function toggleTask(id) {
    const updated = await api(`${API_TASKS}/${id}/toggle`, { method: "PATCH" });
    const t = allTasks.find((x) => x.id === id);
    if (t && updated) Object.assign(t, updated);
    renderAll();
    toast(updated.completed ? "Tarea completada" : "Tarea pendiente");
  }

  async function deleteTask(id) {
    await api(`${API_TASKS}/${id}`, { method: "DELETE" });
    allTasks = allTasks.filter((t) => t.id !== id);
    renderAll();
    toast("Tarea eliminada");
  }

  // ── Task dialog ──────────────────────────────────────────────

  function openTaskDialog(task = null) {
    $("#task-dialog-title").textContent = task ? "Editar tarea" : "Nueva tarea";
    $("#task-id").value = task ? task.id : "";
    $("#task-title").value = task ? task.title : "";
    $("#task-desc").value = task ? task.description || "" : "";
    $("#task-priority").value = task ? task.priority : "MEDIUM";
    $("#task-role").value = task && task.roleId ? task.roleId : "";
    taskDialog.showModal();
    $("#task-title").focus();
  }

  taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = $("#task-id").value;
    const title = $("#task-title").value.trim();
    if (!title) return;

    const body = {
      title,
      description: $("#task-desc").value.trim() || null,
      priority: $("#task-priority").value,
      roleId: $("#task-role").value ? Number($("#task-role").value) : null,
    };

    if (id) {
      const updated = await api(`${API_TASKS}/${id}`, { method: "PUT", body: JSON.stringify(body) });
      const idx = allTasks.findIndex((t) => t.id === Number(id));
      if (idx !== -1) allTasks[idx] = updated;
      toast("Tarea actualizada");
    } else {
      const created = await api(API_TASKS, { method: "POST", body: JSON.stringify(body) });
      if (created) allTasks.unshift(created);
      toast("Tarea creada");
    }
    taskDialog.close();
    renderAll();
  });

  taskCancel.addEventListener("click", () => taskDialog.close());

  // ── Roles ────────────────────────────────────────────────────

  function renderRoles() {
    const allRolesFull = allRoles;
    rolesGrid.innerHTML = "";
    emptyRoles.hidden = allRolesFull.length > 0;

    allRolesFull.forEach((r) => {
      const count = allTasks.filter((t) => t.roleId === r.id).length;
      const card = document.createElement("div");
      card.className = "role-card";
      card.innerHTML = `
        <div class="role-card-header">
          <div class="role-name">${esc(r.name)}</div>
          <div class="role-count">${count} tarea${count !== 1 ? "s" : ""}</div>
        </div>
        ${r.description ? `<div class="role-desc">${esc(r.description)}</div>` : ""}
        <div class="role-card-footer">
          <span class="role-status ${r.active ? "active" : "inactive"}">${r.active ? "Activo" : "Inactivo"}</span>
          <div class="role-actions">
            <button class="btn-icon edit" aria-label="Editar" title="Editar">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
            </button>
            <button class="btn-icon danger delete" aria-label="Eliminar" title="Eliminar">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V3h4v1M5 4v9h6V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>`;

      card.querySelector(".edit").addEventListener("click", () => openRoleDialog(r));
      card.querySelector(".delete").addEventListener("click", () => deleteRole(r.id));
      rolesGrid.appendChild(card);
    });
  }

  function openRoleDialog(role = null) {
    $("#role-dialog-title").textContent = role ? "Editar rol" : "Nuevo rol";
    $("#role-id").value = role ? role.id : "";
    $("#role-name").value = role ? role.name : "";
    $("#role-desc").value = role ? role.description || "" : "";
    roleDialog.showModal();
    $("#role-name").focus();
  }

  roleForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = $("#role-id").value;
    const name = $("#role-name").value.trim();
    if (!name) return;

    const body = { name, description: $("#role-desc").value.trim() || null };

    if (id) {
      const updated = await api(`${API_ROLES}/${id}`, { method: "PUT", body: JSON.stringify(body) });
      const idx = allRoles.findIndex((r) => r.id === Number(id));
      if (idx !== -1) allRoles[idx] = updated;
      toast("Rol actualizado");
    } else {
      const created = await api(API_ROLES, { method: "POST", body: JSON.stringify(body) });
      if (created) allRoles.push(created);
      toast("Rol creado");
    }
    roleDialog.close();
    renderAll();
  });

  roleCancel.addEventListener("click", () => roleDialog.close());

  async function deleteRole(id) {
    const tasksWithRole = allTasks.filter((t) => t.roleId === id);
    if (tasksWithRole.length > 0) {
      toast(`No se puede eliminar: ${tasksWithRole.length} tarea(s) asignada(s)`, "error");
      return;
    }
    await api(`${API_ROLES}/${id}`, { method: "DELETE" });
    allRoles = allRoles.filter((r) => r.id !== id);
    renderAll();
    toast("Rol eliminado");
  }

  // ── Role filter ──────────────────────────────────────────────

  function renderRoleFilter() {
    roleFilterBar.innerHTML = `<button class="role-tag ${currentRoleFilter === "all" ? "active" : ""}" data-role="all">Todos</button>`;
    allRoles.forEach((r) => {
      const btn = document.createElement("button");
      btn.className = `role-tag ${currentRoleFilter == r.id ? "active" : ""}`;
      btn.dataset.role = r.id;
      btn.textContent = r.name;
      roleFilterBar.appendChild(btn);
    });

    roleFilterBar.querySelectorAll(".role-tag").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentRoleFilter = btn.dataset.role;
        renderRoleFilter();
        renderTasks();
      });
    });
  }

  function renderRoleSelect() {
    const sel = $("#task-role");
    const current = sel.value;
    sel.innerHTML = '<option value="">Sin rol</option>';
    allRoles.filter((r) => r.active).forEach((r) => {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = r.name;
      sel.appendChild(opt);
    });
    sel.value = current;
  }

  // ── Stats ────────────────────────────────────────────────────

  function updateStats() {
    const total = allTasks.length;
    const done = allTasks.filter((t) => t.completed).length;
    statTotal.textContent = total;
    statDone.textContent = done;
  }

  // ── Navigation ───────────────────────────────────────────────

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const view = item.dataset.view;
      switchView(view);
      sidebar.classList.remove("open");
    });
  });

  function switchView(view) {
    currentView = view;
    navItems.forEach((n) => n.classList.toggle("active", n.dataset.view === view));
    views.forEach((v) => v.classList.toggle("active", v.id === `${view}-view`));
    pageTitle.textContent = view === "tasks" ? "Tareas" : "Roles";
    addBtn.style.display = view === "tasks" ? "" : "none";
  }

  addBtn.addEventListener("click", () => {
    if (currentView === "tasks") openTaskDialog();
    else openRoleDialog();
  });

  menuToggle.addEventListener("click", () => sidebar.classList.toggle("open"));

  // ── Filters ──────────────────────────────────────────────────

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => { b.classList.remove("active"); b.setAttribute("aria-selected", "false"); });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(renderTasks, 200);
  });

  // ── Helpers ──────────────────────────────────────────────────

  function fmtDate(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  }

  function labelP(p) {
    return { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta" }[p] || p;
  }

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function toast(msg, type = "success") {
    const el = document.createElement("div");
    el.className = `toast${type === "error" ? " error" : ""}`;
    el.textContent = msg;
    $("#toasts").appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  // ── Init ─────────────────────────────────────────────────────

  loadAll();
})();
