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

### Integración OpenRouter (chat de atención)

Configura estas variables de entorno para activar el chat con IA:

- `OPENROUTER_API_KEY` (obligatoria)
- `OPENROUTER_MODEL` (opcional, default: `openai/gpt-4o-mini`)
- `OPENROUTER_SITE_URL` (opcional, default: `http://localhost:5099`)
- `OPENROUTER_APP_NAME` (opcional, default: nombre de tienda)

Ejemplo PowerShell (sesión actual):

```powershell
$env:OPENROUTER_API_KEY="tu_api_key"
$env:OPENROUTER_MODEL="openai/gpt-4o-mini"
dotnet run --project backend/Tienda.Api.csproj
```

El endpoint usado por frontend es: `POST /api/support/chat`.
El system prompt del asistente se toma de la configuración del panel Admin (campo prompt de atención).

También puedes configurar OpenRouter desde el panel Admin > Atención:

- API key
- Modelo
- Site URL
- App Name

Estas credenciales se guardan en SQLite en una tabla privada (`support_config`) y no se exponen en `/api/catalog`.

### Levantar frontend

```bash
npm run dev
```

Vite ya tiene proxy configurado para `/api` y `/uploads` hacia el backend.

## Credenciales de demo

- Usuario: `admin@tienda.com`
- Contraseña: `123456`
