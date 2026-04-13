FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
# Imagen con SDK completo para COMPILAR la API

WORKDIR /src
# Carpeta de trabajo dentro del contenedor de build

COPY backend/Tienda.Api.csproj backend/
# Copia primero el .csproj para aprovechar cache en restore

RUN dotnet restore backend/Tienda.Api.csproj
# Restaura dependencias NuGet

COPY backend/ backend/
# Copia todo el código del backend

RUN dotnet publish backend/Tienda.Api.csproj -c Release -o /app/publish
# Compila y publica en modo Release en /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0
# Imagen liviana runtime para EJECUTAR la app (sin SDK)

WORKDIR /app
# Carpeta de ejecución

COPY --from=build /app/publish .
# Trae los binarios publicados desde la etapa de build

ENV ASPNETCORE_URLS=http://+:5099
# Hace que el backend escuche en el puerto 5099 dentro del contenedor

EXPOSE 5099
# Documenta el puerto que usa el contenedor

ENTRYPOINT ["dotnet", "Tienda.Api.dll"]
# Comando de arranque del backend
