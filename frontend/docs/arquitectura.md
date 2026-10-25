# Arquitectura del Frontend (Feature-Based)

Esta aplicación sigue una arquitectura **Feature-Based Modular**, diseñada para aislar responsabilidades, simplificar el mantenimiento, desacoplar el CSS y facilitar el escalado de funcionalidades.

---

## 1. Estructura de Directorios

```text
frontend/src/
├── app/                  # Núcleo de la aplicación (Shell)
│   ├── components/       # Guardias de ruta (ProtectedRoute, AdminRoute)
│   ├── layouts/          # Layout principal (MainLayout) y estilos globales de layout
│   ├── providers/        # Proveedores y configuraciones iniciales (DemoAutoLogin)
│   └── router/           # Configuración central de rutas (AppRoutes.tsx)
│
├── features/             # Módulos autónomos organizados por dominio
│   ├── admin/            # Panel de control, métricas, gestión de usuarios y catálogo
│   │   ├── api/          # adminApi.ts
│   │   ├── pages/        # AdminDashboardPage, AdminUsersPage, AdminCatalogPage
│   │   ├── styles/       # adminDashboard.css, adminUsers.css, adminCatalog.css
│   │   ├── types/        # admin.types.ts
│   │   └── index.ts      # Barrel export público del feature
│   ├── auth/             # Autenticación, sesión y perfil
│   │   ├── api/          # authApi.ts
│   │   ├── components/   # AuthDialog.tsx
│   │   ├── pages/        # LoginPage.tsx, RegisterPage.tsx
│   │   ├── store/        # authStore.ts (Zustand con persistencia)
│   │   ├── styles/       # authDialog.css, authPage.css
│   │   ├── types/        # auth.types.ts
│   │   └── index.ts
│   ├── lists/            # Listas de compra y optimizador multitienda
│   │   ├── api/          # listaApi.ts
│   │   ├── pages/        # MyListsPage.tsx, ListDetailPage.tsx
│   │   ├── styles/       # myLists.css, listDetail.css
│   │   ├── types/        # lists.types.ts
│   │   └── index.ts
│   ├── navigation/       # Barra de navegación global
│   │   ├── components/   # Navbar.tsx
│   │   ├── styles/       # navbar.css
│   │   └── index.ts
│   └── products/         # Catálogo de productos, filtros, vistas y comparativas
│       ├── api/          # productoApi.ts, supermercadoApi.ts
│       ├── components/   # ProductCard, ProductFilters, ProductPagination, Modales
│       ├── pages/        # HomePage.tsx, ComparativosPage.tsx
│       ├── styles/       # products.css, comparativos.css
│       ├── types/        # products.types.ts
│       ├── utils/        # formatters.ts
│       └── index.ts
│
├── shared/               # Código reutilizable y transversal
│   ├── api/              # Cliente Axios configurado con inyección de auth
│   ├── lib/              # Utilidades de utilidad general (cn, getErrorMessage)
│   ├── types/            # Tipos genéricos de API y entidades comunes
│   └── ui/               # Barrel export de primitivas UI
│
├── components/
│   └── ui/               # Primitivas de diseño shadcn UI (Button, Card, Dialog, Badge, Input)
│
├── pages/                # Capa de compatibilidad retroactiva (re-exports)
├── api/                  # Capa de compatibilidad retroactiva de APIs
├── store/                # Capa de compatibilidad retroactiva de stores
├── index.css             # Tokens de diseño, tema claro/oscuro y Tailwind
└── main.tsx              # Punto de entrada de la aplicación
```

---

## 2. Principios y Reglas de Dependencias

1. **Aislamiento de Features**:
   - Cada feature encapsula sus propias páginas, componentes internos, llamadas a la API y estilos.
   - Todo lo que un feature expone hacia afuera se exporta a través de su archivo `index.ts`.
   - Una feature no debe importar componentes internos privados de otra feature directamente; solo debe interactuar mediante APIs públicas o a través de `src/shared/`.

2. **Desacoplamiento de Estilos CSS**:
   - Se prohíbe el uso de bloques `<style>` incrustados en componentes React (`.tsx`).
   - Los estilos residen en archivos `.css` adyacentes dentro de la carpeta `styles/` del feature correspondiente.
   - Cada hoja de estilos utiliza nombres de clase BEM o prefijos semánticos para evitar colisiones globales.

3. **Inyección de Dependencias en API (Axios)**:
   - `src/shared/api/axios.ts` no importa directamente `authStore` para evitar referencias circulares durante la inicialización de módulos.
   - En su lugar, utiliza `setApiAuthHandlers({ getToken, onUnauthorized })` registrado desde `App.tsx` para suministrar el token dinámico y la acción de logout.

4. **Path Alias `@/*`**:
   - Se utiliza `@/` mapeado a `src/` (configurado en `tsconfig.json` y `vite.config.ts`) para evitar rutas relativas frágiles como `../../../../shared`.
