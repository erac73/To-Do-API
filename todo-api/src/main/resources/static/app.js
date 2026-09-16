(() => {
  "use strict";

  const API = "/api/tasks";

  // DOM refs
  const form = document.getElementById("task-form");
  const titleInput = document.getElementById("task-title");
  const descInput = document.getElementById("task-description");
  const prioritySelect = document.getElementById("task-priority");
  const detailsRow = document.querySelector(".form-details");
  const taskList = document.getElementById("task-list");
  const emptyState = document.getElementById("empty-state");
  const loadingState = document.getElementById("loading-state");
  const searchInput = document.getElementById("search-input");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const summary = document.getElementById("task-summary");
  const dialog = document.getElementById("edit-dialog");
  const editForm = document.getElementById("edit-form");
  const toastContainer = document.getElementById("toast-container");

  let currentFilter = "all";
  let allTasks = [];
  let debounceTimer = null;

  // ── Fetch helpers ────────────────────────────────────────────

  async function apiFetch(url, options = {}) {
    try {
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Error ${res.status}`);
      }
      if (res.status === 204) return null;
      return res.json();
    } catch (err) {
      showToast(err.message, "error");
      throw err;
    }
  }

  // ── Load tasks ───────────────────────────────────────────────

  async function loadTasks() {
    loadingState.hidden = false;
    emptyState.hidden = true;
    taskList.innerHTML = "";

    try {
      allTasks = await apiFetch(API);
      renderTasks();
    } finally {
      loadingState.hidden = true;
    }
  }

  // ── Render ───────────────────────────────────────────────────

  function renderTasks() {
    const query = searchInput.value.trim().toLowerCase();
    let filtered = allTasks;

    if (currentFilter === "pending") filtered = filtered.filter((t) => !t.completed);
    else if (currentFilter === "completed") filtered = filtered.filter((t) => t.completed);

    if (query) filtered = filtered.filter((t) => t.title.toLowerCase().includes(query));

    taskList.innerHTML = "";
    emptyState.hidden = filtered.length > 0;

    filtered.forEach((task) => {
      const li = createTaskElement(task);
      taskList.appendChild(li);
    });

    updateSummary();
  }

  function createTaskElement(task) {
    const li = document.createElement("li");
    li.className = `task-item${task.completed ? " completed" : ""}`;
    li.dataset.id = task.id;

    const dateStr = formatDate(task.createdAt);

    li.innerHTML = `
      <button
        class="task-check"
        role="checkbox"
        aria-checked="${task.completed}"
        aria-label="${task.completed ? "Marcar como pendiente" : "Marcar como completada"}"
        title="${task.completed ? "Marcar como pendiente" : "Marcar como completada"}"
      ></button>
      <div class="task-body">
        <div class="task-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ""}
        <div class="task-footer">
          <span class="priority-badge priority-${task.priority}">${labelPriority(task.priority)}</span>
          <span class="task-date">${dateStr}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="btn-icon edit" aria-label="Editar tarea" title="Editar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
        </button>
        <button class="btn-icon delete" aria-label="Eliminar tarea" title="Eliminar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V3h4v1M5 4v9h6V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    `;

    // Events
    const checkBtn = li.querySelector(".task-check");
    checkBtn.addEventListener("click", () => toggleTask(task.id));

    li.querySelector(".edit").addEventListener("click", () => openEditDialog(task));
    li.querySelector(".delete").addEventListener("click", () => deleteTask(task.id));

    return li;
  }

  // ── Create ───────────────────────────────────────────────────

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title) {
      titleInput.focus();
      return;
    }

    const body = {
      title,
      description: descInput.value.trim() || null,
      priority: prioritySelect.value,
    };

    const created = await apiFetch(API, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (created) {
      allTasks.unshift(created);
      renderTasks();
      form.reset();
      detailsRow.classList.remove("open");
      showToast("Tarea creada");
    }
  });

  // Expand details on title focus
  titleInput.addEventListener("focus", () => detailsRow.classList.add("open"));

  // ── Toggle ───────────────────────────────────────────────────

  async function toggleTask(id) {
    const task = allTasks.find((t) => t.id === id);
    if (!task) return;

    const updated = await apiFetch(`${API}/${id}/toggle`, { method: "PATCH" });
    if (updated) {
      Object.assign(task, updated);
      renderTasks();
      showToast(updated.completed ? "Tarea completada" : "Tarea pendiente");
    }
  }

  // ── Delete ───────────────────────────────────────────────────

  async function deleteTask(id) {
    await apiFetch(`${API}/${id}`, { method: "DELETE" });
    allTasks = allTasks.filter((t) => t.id !== id);
    renderTasks();
    showToast("Tarea eliminada");
  }

  // ── Edit dialog ──────────────────────────────────────────────

  function openEditDialog(task) {
    document.getElementById("edit-id").value = task.id;
    document.getElementById("edit-title").value = task.title;
    document.getElementById("edit-description").value = task.description || "";
    document.getElementById("edit-priority").value = task.priority;
    dialog.showModal();
    document.getElementById("edit-title").focus();
  }

  document.getElementById("dialog-cancel").addEventListener("click", () => dialog.close());

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("edit-id").value;
    const title = document.getElementById("edit-title").value.trim();
    if (!title) return;

    const body = {
      title,
      description: document.getElementById("edit-description").value.trim() || null,
      priority: document.getElementById("edit-priority").value,
    };

    const updated = await apiFetch(`${API}/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    if (updated) {
      const idx = allTasks.findIndex((t) => t.id === Number(id));
      if (idx !== -1) allTasks[idx] = updated;
      renderTasks();
      dialog.close();
      showToast("Tarea actualizada");
    }
  });

  // ── Filters ──────────────────────────────────────────────────

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  // ── Search ───────────────────────────────────────────────────

  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(renderTasks, 200);
  });

  // ── Summary ──────────────────────────────────────────────────

  function updateSummary() {
    const total = allTasks.length;
    const done = allTasks.filter((t) => t.completed).length;
    const pending = total - done;
    if (total === 0) {
      summary.textContent = "";
    } else {
      summary.textContent = `${pending} pendiente${pending !== 1 ? "s" : ""} · ${done} completada${done !== 1 ? "s" : ""}`;
    }
  }

  // ── Helpers ──────────────────────────────────────────────────

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  }

  function labelPriority(p) {
    return { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta" }[p] || p;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast${type === "error" ? " error" : ""}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  // ── Init ─────────────────────────────────────────────────────

  loadTasks();
})();
