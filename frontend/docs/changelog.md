# Changelog Frontend

## [v3.4] - Hero Banner Superior de Ofertas & Ahorro
- **Nuevo Componente HeroBanner (`src/features/products/components/HeroBanner.tsx`):**
  - Incorporado en la cabecera de la columna principal del catálogo (`.catalog-main-column`), alineado armónicamente con el sidebar de filtros.
  - Badge píldora `✨ AHORRÁ EN TUS COMPRAS` con gradiente esmeralda y soporte de temas.
  - Título principal `"Compará precios en los principales supermercados"` y subtítulo explicativo de ahorro de tiempo y dinero.
  - Fila de logotipos de las cadenas integradas (Comodín, Día y Vea) en chips blancos destacados con sombra y micro-interacciones hover.
  - Gráfica recortada de alta definición de bolsa de compras con alimentos frescos (`/images/hero-groceries.png`) con transparencia alfa perfecta, sin rebordes ni cajas blancas residuales.
- **Estilos Desacoplados y Responsivos (`src/features/products/styles/hero-banner.css`):**
  - Soporte completo para Modo Claro (gradiente menta/verde suave) y Modo Oscuro (gradiente esmeralda/pizarra con iluminación interior).
  - Breakpoints responsivos para desktop, tablets (< 960px) y móviles (< 680px) con reorganización vertical limpia.
- **Reemplazo de Cabecera Legacy en `HomePage.tsx`:**
  - Retiro definitivo del antiguo bloque `.home-header` de fondo oscuro y ajuste del padding superior del catálogo a `1.75rem`.
  - Exportación del componente desde `src/features/products/index.ts`.

## [v3.3] - Desacoplamiento de HomePage (Clean Architecture, Custom Hooks y Grilla Modular)
- **Eliminación de God Component en `HomePage.tsx`:**
  - Reducción drástica del archivo de más de 620 líneas a un orquestador declarativo y conciso de ~180 líneas, enfocado exclusivamente en layout y composición.
  - Creación del hook `useProductCatalog` (`src/features/products/hooks/useProductCatalog.ts`) para encapsular estados de filtros, búsqueda con debounce, llamadas a `productoApi`, paginación y cálculos derivados en memoria (`filteredProducts`, `activeFiltersCount`).
  - Creación del hook `useAddToList` (`src/features/products/hooks/useAddToList.ts`) para aislar la lógica de autenticación, modales de adición a listas de compra, selección de tienda/cantidad y feedback de errores/alertas.
  - Creación del componente de presentación `ProductCatalogGrid` (`src/features/products/components/ProductCatalogGrid.tsx`) para aislar el renderizado de tarjetas en modo compacto vs clásico (expansión de tiendas), skeletons de carga y estado vacío.
- **Ajuste Elástico de Altura del Sidebar:**
  - Configurado `height: fit-content;` con `align-items: flex-start` en `.catalog-layout`, logrando que el sidebar abrace y ajuste su altura dinámicamente cuando los acordeones se contraen o expanden sin dejar espacios en blanco sobrantes.

## [v3.2] - Nuevo Sidebar de Filtros Moderno & Drawer Móvil
- **Sidebar de Filtros Sticky con Acordeones:**
  - Rediseño modular con subcomponentes: `CategoryFilterSection`, `BrandFilterSection`, `PriceSortFilterSection`, `SupermarketFilterSection` y `DiscountFilterSection`.
  - Acordeones colapsables independientes con animaciones fluidas y persistencia visual.
  - Búsqueda de marcas en tiempo real con debounce integrado en el acordeón de marcas.
  - Filtro por rango de precio (mínimo y máximo) y ordenamiento por precio ('Por defecto', 'Menor a mayor', 'Mayor a menor').
- **Drawer Móvil y Tablet (< 1024px):**
  - Implementación del componente `FilterDrawer` que abre un sheet lateral deslizante mediante botón flotante con badge de filtros activos.
  - Bloqueo de scroll en `body` cuando el drawer está abierto y cierre mediante botón o click en overlay.

## [v3.1] - Rediseño del Navbar, Atajos Rápidos y Modales de Información de Supermercados
- **Búsqueda Central en Navbar:**
  - Input de búsqueda global desacoplado (`NavbarSearch.tsx`) con debounce de 350ms sincronizado con la URL (`?q=...`) y la página de catálogo.
- **Logos de Supermercados y Modales Informativos:**
  - Atajos rápidos a supermercados con logos oficiales en SVG (`CartBrandIcon.tsx`).
  - Modal informativo modal (`SupermarketInfoModal.tsx`) con información de sucursales, horarios y enlaces oficiales.
- **Menú de Usuario y Tema:**
  - Menú desplegable flotante de usuario (`UserDropdownMenu.tsx`) con opciones de perfil, mis listas, panel de administración y cierre de sesión.
  - Switch de tema claro/oscuro con iconos animados y persistencia en `localStorage`.

## [v3.0] - Refactorización Integral a Arquitectura Feature-Based y Desacoplamiento de Estilos CSS
- **Arquitectura Feature-Based (`src/app/`, `src/features/`, `src/shared/`)**:
  - **`src/app/`**: Enrutador central (`AppRoutes.tsx`), layout principal (`MainLayout.tsx`), layout styles (`mainLayout.css`), guardias de ruta (`ProtectedRoute.tsx`, `AdminRoute.tsx`) y provider demo (`DemoAutoLogin.tsx`).
  - **`src/features/auth/`**: Módulo de autenticación con `LoginPage`, `RegisterPage`, `AuthDialog`, `authStore` (Zustand), `authApi`, tipos DTO y estilos dedicados (`authDialog.css`, `authPage.css`).
  - **`src/features/navigation/`**: Barra de navegación (`Navbar.tsx`) responsiva, con avatar de usuario, switch de tema y estilos desacoplados (`navbar.css`).
  - **`src/features/products/`**: Catálogo principal (`HomePage.tsx`), módulo de comparación (`ComparativosPage.tsx`), componentes modulares (`ProductCard`, `ProductFilters`, `ProductPagination`, `AddToListModal`, `AlertModal`), APIs (`productoApi`, `supermercadoApi`), formateadores y estilos (`products.css`, `comparativos.css`).
  - **`src/features/lists/`**: Gestión de listas de compra (`MyListsPage.tsx`), detalle y optimización (`ListDetailPage.tsx`), cliente API (`listaApi`), tipos y estilos (`myLists.css`, `listDetail.css`).
  - **`src/features/admin/`**: Panel administrativo (`AdminDashboardPage.tsx`, `AdminUsersPage.tsx`, `AdminCatalogPage.tsx`), cliente `adminApi`, tipos y estilos (`adminDashboard.css`, `adminUsers.css`, `adminCatalog.css`).
  - **`src/shared/`**: Núcleo reutilizable con cliente Axios desacoplado (`shared/api/axios.ts` con callbacks dinámicos de auth para prevenir dependencias circulares), utilitarios (`cn`, `getErrorMessage`), interfaces comunes (`api.ts`, `supermercado.ts`) y barrel export de UI primitives.
  - **`src/components/ui/`**: Primitivas de UI basadas en shadcn (`button`, `card`, `dialog`, `badge`, `input`).
  - Configuración de alias `@/*` en TypeScript (`tsconfig.json`, `tsconfig.app.json`) y Vite (`vite.config.ts`).
- **Desacoplamiento Total de Estilos CSS**:
  - Eliminación del 100% de los bloques `<style>` incrustados en componentes React (más de 3,500 líneas extraídas).
  - Creación de hojas de estilos modulares con clases semánticas consistentes por cada feature.
- **Correcciones y Mejoras (Bug Fixes & UX)**:
  - **Filtro de Supermercado en Vista Clásica**: Corrección en `HomePage.tsx` para filtrar las ofertas de cada producto maestro según el `supermercadoId` activo, sincronizando las tarjetas mostradas y el contador total con el filtro seleccionado.
  - **AuthDialog z-index**: Aumento de z-index a `z-[1000]` en el modal de autenticación para evitar que el Navbar sticky (`z-index: 100`) tape el formulario de login/registro.
  - **Autofocus en Búsqueda**: Implementación de `useRef` + `useEffect` en `ProductFilters.tsx` para garantizar el foco inmediato en el campo de búsqueda al montar el componente en SPA.
- **Retrocompatibilidad y Limpieza**:
  - Capa de compatibilidad retroactiva mantenida en `src/pages/` y `src/api/` para redirigir a los nuevos módulos de features sin romper dependencias legacy.
  - Eliminación de proxies obsoletos en `src/components/` (`Navbar.tsx`, `Layout.tsx`, `AuthDialog.tsx`).

## [v2.4] - Filtro Dinámico por Marca en Búsqueda
- **Componentes:**
  - Se añadió un nuevo filtro desplegable de "Marca" en `Home.tsx`.
  - El filtro se habilita dinámicamente y se rellena solo con las marcas disponibles de los resultados actuales de la búsqueda.
- **API:**
  - Actualización de `productoApi.ts` para enviar el parámetro `marca` en `buscarPaginado`.
  - Se añadió `obtenerMarcas` para consultar `GET /productos/busqueda/marcas`.
- **Correcciones (Hotfixes):**
  - Se optimizaron los hooks `useEffect` en `Home.tsx` eliminando llamadas redundantes a `fetchProducts` durante el montaje inicial, lo que reducía el rendimiento y generaba peticiones duplicadas a la API.

## [v2.3] - Paginación, Ordenamiento y Endpoints de Búsqueda
- **Home (Paginación y UI):**
  - Se actualizó `Home.tsx` para consumir el nuevo endpoint `/busqueda` paginado, abandonando la antigua ruta `/comparativo/todos`.
  - Se añadieron controles de paginación reales (botones Anterior/Siguiente) basados en `totalPages` y `page` enviados por el backend.
  - Se añadió la información de la cantidad total de resultados (`totalElements`).
- **Ordenamiento (Server-Side):**
  - Se delegó el ordenamiento por precio al backend, enviando dinámicamente el parámetro `sort` (`precio,asc` o `precio,desc`) desde React hacia el servidor.
- **API (productoApi.ts):**
  - Se actualizó el endpoint base de búsqueda de productos hacia `/productos/busqueda`.
  - Se implementó la nueva función `buscarPaginado` en `productoApi.ts` que devuelve la interfaz `PaginaProductos` en lugar de una lista plana, soportando parámetros de paginación y ordenamiento.
- **Tipos:**
  - Se agregaron las interfaces `PaginaProductos` y actualizadas las estructuras en `types/Supermercado.ts` para manejar la respuesta paginada del servidor.

## Estructura Inicial
- Configuración del proyecto con Vite, React y TypeScript.
- Integración de Tailwind CSS para el diseño.
- Configuración de React Router para la navegación.
- Tipado estricto TypeScript con interfaces centralizadas en `types/Supermercado.ts`: `Supermercado`, `ProductoBusqueda`, `ApiResponse<T>`, `ListaCompra`, `ItemLista`, `ListaCompraDetalle`, `ProductoOptimo`, `TiendaOptima`, `OptimizacionCompra`.
- Rutas definidas: `/home`, `/mis-listas`, `/mis-listas/:id` (detalle), `/login`, `/registro`, wildcard redirige a `/home`.

## Autenticación y Seguridad
- Implementado sistema de Login (`/login`) y Registro (`/registro`).
- Validación cliente en formularios: formato de email (regex), contraseña mínima 6 caracteres, coincidencia de contraseñas en registro, campos obligatorios.
- Manejo de errores de API con banners visuales (error-banner) y estados `submitting` para deshabilitar botones durante peticiones.
- Configurado Axios con interceptores para adjuntar automáticamente el token JWT en las peticiones (`Bearer token`).
- Configuración base URL: `http://localhost:8080/api/v1`.
- Implementado `authStore` con Zustand para la gestión persistente del estado del usuario y el token en `localStorage`.
- Creado componente `ProtectedRoute` para restringir el acceso a rutas privadas si no hay un token válido.
- **Auto-login Demo**: Componente `DemoAutoLogin` con flag `MOCK_ENABLED = false` por defecto (desactivado) para que no pise tokens JWT reales del backend. Activa `MOCK_ENABLED = true` localmente si no tenés backend corriendo.

## Capa de API Modularizada (alineada con endpoints del backend)
- `api/axios.ts`: Instancia Axios centralizada con interceptor de token.
- `api/productoApi.ts`: Endpoint `buscar(nombre?, supermercadoId?)` → `GET /precios/buscar` con filtros por query params + **normalizador robusto `normalizeProducto`** que acepta distintos nombres de campos (`id`/`productoId`/`productoMaestroId`, `precio`/`precioActual`, `nombreSupermercado`/`supermercado`/`supermercadoNombre`, `nombreGenerico`/`nombre`, `descripcion`). Filtra resultados inválidos.
- `api/supermercadoApi.ts`: Endpoint `getAll()` → `GET /supermercados` con normalización (`id`, `nombre`, `urlBase`) y filtrado de IDs inválidos.
- `api/listaApi.ts`: Módulo completo con:
  - `getAll()` → `GET /listas` (todas las listas del usuario con detalle e ítems).
  - `getById(id)` → `GET /listas/:id`.
  - `create(nombreLista, favorita)` → `POST /listas`.
  - `update(id, nombreLista, favorita)` → `PUT /listas/:id`.
  - `remove(id)` → `DELETE /listas/:id`.
  - `toggleFavorita(id)` → `PATCH /listas/:id/favorita`.
  - `addItem(listaId, productoId, cantidad)` → `POST /listas/:listaId/items`.
  - `getItems(listaId)` → `GET /listas/:listaId/items`.
  - `updateItem(listaId, itemId, productoId, cantidad)` → `PUT /listas/:listaId/items/:itemId`.
  - `removeItem(listaId, itemId)` → `DELETE /listas/:listaId/items/:itemId`.
  - `getCircuitoOptimo(id)` → `GET /listas/:id/circuito-optimo`.

## Módulo de Inicio (Home) — Grilla de productos desde la base de datos
- **Sin datos mock**: Eliminados `MOCK_PRODUCTS` y `MOCK_SUPERMARKETS`. El Home trae productos reales desde la base de datos mediante `GET /precios/buscar`.
- **Flujo de carga**:
  1. Carga inicial paralela (`Promise.all`): `supermercadoApi.getAll()` + `listaApi.getAll()` para supermercados y listas.
  2. `fetchProducts()` dispara `productoApi.buscar(nombre?, supermercadoId?)` con los filtros del usuario.
- **Búsqueda SERVER-SIDE con debounce 400ms**: Al escribir en el input, el término se envía como query param al backend.
- **Filtro por supermercado SERVER-SIDE**: Ahora el select usa el `id` real del supermercado.
- **Ordenamiento por precio SERVER-SIDE**: Selector Por defecto / Menor a Mayor / Mayor a Menor aplicado desde la paginación de base de datos.
- **Skeleton de carga animado**: 6 tarjetas shimmer mientras carga el Home inicial (reemplaza el texto "Cargando productos...").
- **Estado "Buscando..."** en el contador de resultados para búsqueda/filtros asíncronos (para distinguir del loading inicial).
- **Banner de error + botón Reintentar** cuando falla la conexión al backend.
- **Contador de resultados**: "Mostrando X productos filtrados" cuando hay búsqueda/filtro activos.
- **Cuadrícula responsive `grid-template-columns: repeat(auto-fill, minmax(270px, 1fr))`** con gap 1.75rem, max-width 1400px centrado.
- Cada tarjeta: imagen `object-fit: cover` con `loading="lazy"` + **fallback doble con dataset `fallback` para evitar loops** si falla la URL, badge de supermercado, marca en uppercase, nombre (altura mínima 2.8rem), descripción truncada 3 líneas, precio formateado `es-AR` + botón "Agregar".
- Hover en tarjeta: `translateY(-6px)` + sombra suave.
- Key única `producto.id + nombreSupermercado` para evitar colisiones (mismo producto maestro en distintas tiendas).

## Agregar Producto a Lista (desde Home)
- Modal emergente al hacer click en "Agregar" en cualquier tarjeta de producto.
- Vista previa del producto: imagen, nombre, marca, supermercado y precio.
- Caso sin listas: aviso amarillo con botón directo para "Crear mi primera lista" (navega a `/mis-listas`).
- Caso con listas: selector desplegable de listas disponibles (muestra ⭐ en favoritas) + input numérico de cantidad (mínimo 1).
- Confirmación asíncrona con `listaApi.addItem()` + estado `adding` para deshabilitar botones.
- Mensaje de éxito verde ("✅ producto agregado correctamente.") y auto-cierre del modal a los 1.2s.
- Cierre del modal al hacer click fuera (overlay).
- Icono de carrito 🛒 en navbar (placeholder UI).

## Módulo de Mis Listas
- Sección `/mis-listas` con datos reales consumidos desde `listaApi.getAll()`.
- **CRUD completo** refactorizado usando `listaApi`:
  - Crear lista: `listaApi.create(nombre, favorita)` con formulario inline.
  - Editar lista: `listaApi.update(id, ...)` con scroll suave al top + stopPropagation para no abrir detalle.
  - Eliminar lista: `listaApi.remove(id)` con confirmación `alert()`.
  - Listar todas: `listaApi.getAll()` → `ListaCompraDetalle[]` con items y total estimado.
- **Sistema de favoritos**: `listaApi.toggleFavorita(id)` con actualización optimista + rollback en caso de error.
- Highlight visual en listas favoritas (borde dorado `#fbbf24` y estrella rellena ⭐).
- Fecha de creación formateada con `toLocaleDateString()` **+ cantidad de productos + total estimado** en el subtítulo de cada tarjeta.
- **Navegación al detalle**: clickear cualquier parte de la tarjeta navega a `/mis-listas/:id` (excluye los botones Editar/Eliminar/Estrella mediante `stopPropagation`).
- Estados de carga (`Cargando listas...`), error banner y vacío con emoji 📋 + mensaje.
- Efectos hover en tarjetas de lista (`translateY(-2px)`) y cursor pointer.

## Módulo de Detalle de Lista y Optimización de Compra
- Página `ListDetail.tsx` **conectada por ruta** en App.tsx: `/mis-listas/:id` (dentro de ProtectedRoute + Layout).
- Consume datos reales con `listaApi.getById(id)` y `listaApi.getCircuitoOptimo(id)`.
- Encabezado con botón "← Volver", título de la lista + estrella favorita y **botón "+ Agregar productos"** que navega a `/home`.
- Tabla de items responsive con `overflowX: auto` + nuevas columnas: Supermercado.
- Precios formateados con `toLocaleString('es-AR')`.
- **Eliminar item**: `listaApi.removeItem(listaId, itemId)` con confirmación y reset del resultado de optimización.
- Botón **"🚀 Optimizar Compra"** que llama a `getCircuitoOptimo()` con estado `Optimizing...`.
- **Visualización de resultados de optimización** (tarjeta verde con borde):
  - Tarjetas resumen: Total Óptimo, Ahorro Total (verde), Total más caro (rojo).
  - **📍 Hoja de Ruta**: Desglose por supermercado con los productos a comprar en cada tienda y subtotal por tienda (borde izquierdo verde).
  - **⚠️ Productos sin precio**: Aviso naranja con lista de productos sin precio disponible en ningún supermercado.
- Precios formateados con separador de miles `es-AR`.

## Sistema de Tema Claro / Oscuro
- Implementado mediante atributo `data-theme` en `<html>` y variables CSS centralizadas.
- **Tema Claro** (`:root`): brand-blue `#8ca4b8`, brand-peach `#fcece4`, fondo `#f1f3f5`, texto `#2b3a67`.
- **Tema Oscuro** (`[data-theme='dark']`): brand-blue `#5d7a96`, brand-peach `#2d2d3a`, fondo `#121212`, texto `#e0e0e0`, sombras más marcadas.
- Persistencia del tema en `localStorage.getItem('theme')`.
- Toggle en navbar con iconos 🌙/☀️ y animación `scale(1.1)` en hover.
- Transiciones CSS globales smooth (0.3s) en background-color, color, border-color y box-shadow.

## Componentes de Layout y Navegación
- **`Layout.tsx`**: Wrapper de páginas protegidas que incluye Navbar + fondo del tema.
- **`Navbar.tsx`**: Barra de navegación sticky (`top:0, z-index:100`) con:
  - Logo "AhorraYa" con imagen `/Image/Logo.png`.
  - Enlaces directos: Inicio (`/home`), Mis Listas (`/mis-listas`).
  - Acciones: Toggle tema 🌙/☀️, Carrito 🛒 (cierre automático al hacer click fuera).
  - **Información del usuario en sesión**: Avatar circular con la inicial del nombre + nombre completo visible. Tooltip con el email del usuario. Fallback al email si no hay nombre. Diseño tipo "pill" con fondo translúcido.
  - Botón "Salir" con logout y redirección a `/login`.
  - Diseño responsive: oculta el nombre del logo y el nombre del usuario en pantallas menores a 600px (solo muestra el avatar).

## Mejoras de Interfaz (UI/UX)
- Navegación mejorada en el navbar con enlaces directos.
- Manejo de estados de carga (`loading`) y errores de API con `alert()` y mensajes amigables.
- Estilos consistentes usando variables CSS centralizadas.
- Formularios reutilizables: clases `.container`, `.title`, `.subtitle`, `.field`, `.label`, `.input`, `.btn`, `.error`, `.switch`, `.link`, `.btn-secondary`.
- Botones con estados: hover (`brightness(1.1)`), active (`scale(0.98)`), disabled (`background: #ced4da, cursor: not-allowed`).
- Responsive design con media queries (breakpoint 600px).
- Formateo uniforme de precios argentinos: `toLocaleString('es-AR')` en todo el front.
