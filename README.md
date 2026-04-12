# Tienda React

Aplicación base para un catálogo de ventas con carrito, envío de pedidos por WhatsApp y panel de administración para categorías, productos, imágenes y configuración general.

## Funcionalidades

- Catálogo público con categorías.
- Carrito con cantidades y total dinámico.
- Enlace a WhatsApp con el pedido prellenado.
- Panel de administración con login.
- CRUD de categorías y productos.
- Configuración de nombre de tienda y número de WhatsApp.
- Modo claro y oscuro.

## Desarrollo

1. Instala dependencias.
2. Ejecuta `npm run dev`.

## Backend ASP.NET 10 (Controllers) + Integración

Se agregó una API en `backend/` con ASP.NET Web API basada en controladores (clases), no Minimal API:

- Login admin (`admin@tienda.com` / `123456`)
- CRUD de settings, categorías y productos
- Subida de imagen de producto desde el panel admin
- Archivos de imágenes servidos en `/uploads/*`
- Persistencia local con SQLite (`backend/App_Data/store.db`)

### Levantar backend

```bash
dotnet run --project backend/Tienda.Api.csproj
```

Queda en: `http://localhost:5099`

Target framework del backend: `net10.0`.

Base de datos local: SQLite en `backend/App_Data/store.db`.

### Levantar frontend

```bash
npm run dev
```

Vite ya tiene proxy configurado para `/api` y `/uploads` hacia el backend.

## Credenciales de demo

- Usuario: `admin@tienda.com`
- Contraseña: `123456`
