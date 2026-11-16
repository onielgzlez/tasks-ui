# Diseño de Tasks Studio (UI para tasks-api)

Fecha: 2026-11-16
Estado: Aprobado

## Resumen Ejecutivo

Tasks Studio es una interfaz web de alto rendimiento, estética refinada ("Linear-style / Fast Command Flow") y experiencia de usuario fluida para interactuar con `tasks-api`. El objetivo es ofrecer una herramienta rápida, profesional, intuitiva y visualmente distintiva que permita gestionar tareas sin fricción con soporte para teclado, mutaciones optimistas y feedback en tiempo real.

## Backend y Contrato

- **Endpoint base:** `http://127.0.0.1:3000/api/tasks`
- **Autenticación:** `Authorization: Bearer <API_TOKEN>` (token de 64 caracteres hex).
- **Modelo de Tarea:**
  - `id`: entero positivo autoincremental
  - `title`: texto (1–200 caracteres)
  - `description`: texto (0–5000 caracteres)
  - `status`: `'pendiente' | 'en_curso' | 'hecha'`
  - `assignee`: texto (1–100 caracteres)
  - `dueDate`: fecha en formato `YYYY-MM-DD`
  - `createdAt`, `updatedAt`: ISO 8601 UTC
- **Operaciones:**
  - `GET /api/tasks?status=...&assignee=...&page=...&limit=...` (Lista paginada)
  - `POST /api/tasks` (Crear tarea)
  - `GET /api/tasks/:id` (Consultar tarea)
  - `PATCH /api/tasks/:id` (Actualizar campos específicos)
  - `DELETE /api/tasks/:id` (Borrar tarea)
- **Errores:** RFC 7807 `application/problem+json` (`{ type, title, status, instance, errors: [{ field, message }] }`).

## Arquitectura del Frontend

### Stack Tecnológico
- **Node.js 24.x** y **pnpm 12.21.0** (homogéneo con el backend).
- **Vite 6** con **React 19** y **TypeScript** en modo estricto.
- **Tailwind CSS v4** con variables CSS temáticas (dark / light mode).
- **TanStack Query (React Query v5)** para gestión del estado del servidor, caché inteligente y mutaciones optimistas.
- **Lucide React** para iconografía.
- **Sonner** para toasts de notificación elegantes y no intrusivos.
- **Vitest** + **Testing Library** para pruebas unitarias de componentes y cliente API.

### Modelo de Conexión y Autenticación
- Modo Híbrido:
  - En desarrollo, Vite utiliza proxy local hacia `http://127.0.0.1:3000` y lee `VITE_API_TOKEN` de `.env.local` por defecto.
  - La interfaz incluye un Drawer/Modal de Ajustes para inspeccionar la salud de la conexión (`Online`, `Unauthorized`, `Offline`) y permite ingresar o cambiar la URL y el Bearer Token en cualquier momento (persistido en `localStorage`).

### Estructura de Componentes
- `src/api/`: Cliente HTTP tipado, decodificador de RFC 7807 y hooks de TanStack Query (`useTasks`, `useCreateTask`, `useUpdateTask`, `useDeleteTask`, `useTaskHealth`).
- `src/components/layout/`: Barra superior de comandos, selector de vistas (Kanban vs. Lista), badge de estado de API, botón de configuración rápida.
- `src/components/kanban/`: Tablero con 3 columnas (`pendiente`, `en_curso`, `hecha`), tarjetas con acciones rápidas, tags de estado, badge de fecha vencida y transición fluida.
- `src/components/list/`: Vista de lista compacta para escaneo rápido por teclado (`J`/`K` para foco, `Enter` para detalles).
- `src/components/task-drawer/`: Panel lateral para inspección profunda, edición en vivo y eliminación.
- `src/components/task-modal/`: Modal de creación instantánea con atajo `C`, validación reactiva de campos (`title`, `assignee`, `dueDate`, `description`).
- `src/components/settings/`: Drawer de configuración de API (URL base, Bearer Token, prueba de conexión en vivo).
- `src/components/command-palette/`: Buscador global y atajos rápidos accesible con `Cmd+K` o `/`.

## Experiencia de Usuario y Atajos
- `C`: Abrir modal de nueva tarea.
- `Cmd+K` o `/`: Abrir paleta de comandos / buscador.
- `Esc`: Cerrar modales o panel lateral de detalles.
- `1` / `2`: Alternar entre vista Kanban y vista Lista.
- Optimistic UI: El movimiento entre columnas o el cambio de estado se refleja en 0 ms en pantalla; si la API devuelve error, se hace rollback automático con notificación.
