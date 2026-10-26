# Documentación de Rutas y API (Frontend)

## Rutas del Navegador (React Router)
Configuradas en `src/app/router/AppRoutes.tsx`:
- `/login`: Página de inicio de sesión pública.
- `/registro`: Página de creación de cuenta pública.
- `/home`: Catálogo principal de productos (búsqueda, filtros, modo compacto y clásico).
- `/comparativos`: Página de análisis comparativo de precios por producto.
- `/mis-listas`: Sección de gestión de listas de compra (protegida con `ProtectedRoute`).
- `/mis-listas/:id`: Detalle de lista y optimización de circuito de compra (protegida).
- `/admin`: Panel principal de administración (protegida con `AdminRoute`, rol `ROLE_ADMIN`).
- `/admin/usuarios`: Gestión de usuarios y roles del sistema (protegida).
- `/admin/catalogo`: Monitoreo y control del catálogo de productos y scrapers (protegida).

## Consumo de API (Axios)
La configuración base desacoplada se encuentra en `src/shared/api/axios.ts` (con re-export compatible en `src/api/axios.ts`).
Cuenta con inyección dinámica de token y logout mediante `setApiAuthHandlers` para desacoplar Axios del store de Zustand y prevenir dependencias circulares.

### URL Base
`http://localhost:8081/api/v1` (o según variable de entorno `VITE_API_URL`)

### Cabeceras (Headers)
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (se añade automáticamente a través de interceptores si existe un token en la sesión).

### Organización Modular de Endpoints por Feature

#### Autenticación y Usuarios (`src/features/auth/api/authApi.ts`)
- `POST /auth/login`: Autenticación con email y contraseña, devuelve JWT y datos del usuario.
- `POST /usuarios`: Registro de nuevo usuario en el sistema.

#### Productos, Categorías y Supermercados (`src/features/products/api/`)
- `GET /productos/busqueda`: Búsqueda paginada y filtrada (`q`, `supermercadoId`, `marca`, `categoriaId`, `sort`, `page`, `size`).
- `GET /productos/busqueda/marcas`: Lista de marcas disponibles para los filtros activos.
- `GET /categorias`: Listado maestro de categorías (`src/features/products/api/categoriaApi.ts`).
- `GET /precios/comparativo/todos`: Obtención de productos con precios consolidados para el módulo comparativo.
- `GET /supermercados`: Listado de todos los supermercados habilitados en la plataforma.

#### Listas de Compra y Optimización (`src/features/lists/api/listaApi.ts`)
- `GET /listas`: Listas del usuario autenticado.
- `POST /listas`: Creación de nueva lista.
- `GET /listas/{id}`: Detalle de una lista y sus ítems.
- `PUT /listas/{id}`: Actualización de nombre y estado favorito.
- `DELETE /listas/{id}`: Eliminación de una lista.
- `PATCH /listas/{id}/favorita`: Alternar estado de lista favorita.
- `POST /listas/{id}/items`: Añadir producto a una lista.
- `PUT /listas/{id}/items/{itemId}`: Actualizar cantidad de un ítem.
- `DELETE /listas/{id}/items/{itemId}`: Eliminar un ítem de la lista.
- `GET /listas/{id}/circuito-optimo`: Cálculo del circuito óptimo de compra multitienda.

#### Administración (`src/features/admin/api/adminApi.ts`)
- `GET /admin/dashboard/stats`: Métricas generales del sistema.
- `GET /admin/usuarios`: Listado y filtrado de usuarios registrados.
- `PUT /admin/usuarios/{id}/rol`: Modificación de roles de usuario.
- `PATCH /admin/usuarios/{id}/estado`: Bloqueo o activación de cuenta de usuario.
- `GET /admin/catalogo/resumen`: Estadísticas de productos y cobertura de scraping.
- `POST /admin/catalogo/ejecutar-scraper`: Disparo manual de scraping por supermercado.

## Estado Global (Zustand)
Gestionado en `src/features/auth/store/authStore.ts` (con re-export compatible en `src/store/authStore.ts`):
- **Estado**: `user` (id, email, nombre, rol), `token`, `isAuthenticated`, `isAdmin`.
- **Acciones**: `setAuth(user, token)` para login, `logout()` para cerrar sesión y limpiar persistencia en `localStorage`.
