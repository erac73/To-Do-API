# TaskFlow — Gestor de Tareas

API REST + Frontend web para gestionar tareas organizadas por roles. Spring Boot, JPA, H2 y vanilla JS.

---

## Ejecutar

```bash
cd todo-api
mvn spring-boot:run
```

Abrir `http://localhost:8080`

---

## Endpoints

### Tareas

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/tasks` | Listar todas |
| GET | `/api/tasks?completed=true` | Filtrar por estado |
| GET | `/api/tasks?priority=HIGH` | Filtrar por prioridad |
| GET | `/api/tasks?roleId=1` | Filtrar por rol |
| GET | `/api/tasks?search=texto` | Buscar por titulo |
| GET | `/api/tasks/{id}` | Obtener por ID |
| POST | `/api/tasks` | Crear tarea |
| PUT | `/api/tasks/{id}` | Actualizar tarea |
| PATCH | `/api/tasks/{id}/toggle` | Marcar completada |
| DELETE | `/api/tasks/{id}` | Eliminar tarea |

### Roles

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/roles` | Listar todos |
| GET | `/api/roles?activeOnly=true` | Solo activos |
| GET | `/api/roles/{id}` | Obtener por ID |
| POST | `/api/roles` | Crear rol |
| PUT | `/api/roles/{id}` | Actualizar rol |
| PATCH | `/api/roles/{id}/toggle` | Activar/desactivar |
| DELETE | `/api/roles/{id}` | Eliminar rol |

---

## Ejemplos

### Crear tarea

```json
POST /api/tasks
{
  "title": "Revisar PR",
  "description": "Revisar el pull request #42",
  "priority": "HIGH",
  "roleId": 1
}
```

### Crear rol

```json
POST /api/roles
{
  "name": "Frontend",
  "description": "Tareas de desarrollo de interfaz"
}
```

Prioridades: `LOW`, `MEDIUM`, `HIGH`

---

## Frontend

Interfaz web incluida en `src/main/resources/static/`:

- Panel lateral con navegacion
- Vista de tareas con filtros por estado, prioridad y rol
- Vista de roles con contador de tareas
- Busqueda en tiempo real
- Formularios de creacion y edicion
- Soporte dark mode
- Responsive (mobile-first)
- Accesibilidad: ARIA, navegacion por teclado, focus visible

---

## Estructura

```
src/main/java/com/todoapi/
├── TodoApiApplication.java
├── DataLoader.java
├── model/
│   ├── Task.java
│   └── Role.java
├── dto/
│   ├── TaskDTO.java
│   └── RoleDTO.java
├── repository/
│   ├── TaskRepository.java
│   └── RoleRepository.java
├── service/
│   ├── TaskService.java
│   └── RoleService.java
├── controller/
│   ├── TaskController.java
│   └── RoleController.java
└── exception/
    ├── TaskNotFoundException.java
    ├── RoleNotFoundException.java
    └── GlobalExceptionHandler.java

src/main/resources/static/
├── index.html
├── styles.css
├── app.js
└── logo.svg
```

---

## Tecnologias

- Java 17
- Spring Boot 3.2
- Spring Data JPA
- H2 Database (en memoria)
- HTML / CSS / JavaScript (vanilla)

---

## Requisitos

- Java 17+
- Maven 3.9+
