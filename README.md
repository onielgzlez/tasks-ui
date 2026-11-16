# Tasks Studio

Interfaz de usuario web moderna, rápida y orientada a teclado para [tasks-api](../tasks-api). Diseñada con estética inspirada en Linear, arquitectura por componentes en React 19, TypeScript estricto, Tailwind CSS y mutaciones optimistas con TanStack Query.

## Requisitos

- **Node.js 24.x**
- **pnpm 12.21.0**

## Inicio Rápido

1. Instalar dependencias:

```sh
pnpm install
```

2. Configurar el entorno:

Copia `.env.example` a `.env.local` y añade el `API_TOKEN` generado en `tasks-api/.env`:

```sh
cp .env.example .env.local
```

Si el servidor `tasks-api` ya tiene un token generado en `../tasks-api/.env`, puedes copiarlo automáticamente:

```sh
node -e "const fs = require('fs'); const env = fs.readFileSync('../tasks-api/.env', 'utf8'); const match = env.match(/API_TOKEN=([a-f0-9]+)/); if (match) fs.writeFileSync('.env.local', 'VITE_API_URL=/api/tasks\nVITE_API_TOKEN=' + match[1] + '\n');"
```

3. Iniciar el servidor de desarrollo:

```sh
pnpm dev
```

La interfaz estará disponible en `http://localhost:5173`. En desarrollo, Vite redirige las peticiones `/api/tasks` mediante proxy a `http://127.0.0.1:3000`, evitando problemas de CORS.

## Variables de Entorno

| Variable         | Valor por defecto | Uso                                                            |
| ---------------- | ----------------- | -------------------------------------------------------------- |
| `VITE_API_URL`   | `/api/tasks`      | Ruta base o URL del backend de tareas                          |
| `VITE_API_TOKEN` | Cadena vacía      | Token Bearer de 64 caracteres hexadecimales para autenticación |

> **Nota:** La aplicación también permite ver y modificar la URL y el Token en vivo desde el panel de **Ajustes** en la propia interfaz, persistiendo los cambios en `localStorage` sin necesidad de reiniciar el servidor Vite.

## Atajos de Teclado (Power User)

| Tecla / Combinación   | Acción                                              |
| --------------------- | --------------------------------------------------- |
| `C`                   | Abrir modal de creación de nueva tarea              |
| `⌘K` o `Ctrl+K`       | Abrir Paleta de Comandos y buscador global          |
| `/`                   | Foco en la búsqueda y comandos                      |
| `1`                   | Cambiar a vista **Tablero Kanban**                  |
| `2`                   | Cambiar a vista **Lista Rápida**                    |
| `J` / `K` o `↓` / `↑` | Navegar entre filas en la vista de Lista            |
| `Espacio`             | Avanzar estado de la tarea seleccionada en la lista |
| `Enter`               | Abrir detalle/edición de la tarea en la lista       |
| `Esc`                 | Cerrar cualquier modal o panel lateral              |

## Comandos del Proyecto

```sh
pnpm dev           # Inicia el servidor de desarrollo Vite con HMR
pnpm check         # Verificación completa: formato + tipos + tests + build
pnpm test          # Ejecuta los tests unitarios con Vitest
pnpm typecheck     # Comprobación de tipos con tsc --noEmit
pnpm format        # Aplica formato con Prettier
pnpm format:check  # Comprueba el formato sin modificar archivos
pnpm build         # Compilación optimizada para producción
pnpm preview       # Vista previa local del bundle de producción
```

## Características Principales

- **Tablero Kanban Interactivo**: Columnas para _Pendiente_, _En curso_ y _Hecha_, con contadores, creación rápida en columna y avance de estado con un clic.
- **Lista Rápida (High-Density List)**: Vista compacta para revisar decenas de tareas por minuto, navegable completamente con el teclado.
- **Drawer de Edición en Vivo**: Edición fluida de título, descripción, responsable, estado y fecha de vencimiento sin recargar.
- **Mutaciones Optimistas (0 ms)**: Los cambios de estado y actualizaciones se reflejan instantáneamente en pantalla mientras la API confirma en segundo plano (con rollback automático ante errores de red).
- **Mapeo de Errores RFC 7807**: Presentación amigable de errores de validación (`application/problem+json`), vinculando los fallos directamente al campo correspondiente del formulario.
- **Diagnóstico de Conexión en Tiempo Real**: Badge de pulso en la barra superior que verifica la salud de la API, reporta latencia en milisegundos y alerta sobre tokens ausentes o inválidos (401).
