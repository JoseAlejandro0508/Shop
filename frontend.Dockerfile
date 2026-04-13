FROM node:22-alpine AS build
# Imagen Node para construir el frontend

WORKDIR /app
# Carpeta de trabajo para el build

COPY package*.json ./
# Copia package.json y package-lock.json

RUN npm ci
# Instala dependencias exactas del lockfile (más estable en producción)

COPY . .
# Copia el resto del proyecto

RUN npm run build
# Genera carpeta dist/ del frontend

FROM nginx:1.27-alpine
# Imagen Nginx para servir archivos estáticos

COPY --from=build /app/dist /usr/share/nginx/html
# Copia el build final al directorio público de nginx

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
# Reemplaza config por la nuestra (proxy a backend + SPA routing)

EXPOSE 80
# Puerto HTTP del frontend
