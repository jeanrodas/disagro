# syntax=docker/dockerfile:1
#
# Imagen de producción del frontend: compila la SPA con Node y la sirve con nginx.
#
# Dos etapas: la de build tiene Node, node_modules y el código fuente; la final
# solo recibe los estáticos compilados. En runtime no hay Node, ni dependencias,
# ni fuentes: solo nginx y dist/.
#
# Construir (desde frontend/):  docker build -t disagro-frontend .
# Ejecutar:                      docker run -p 8080:80 -e BACKEND_HOST=backend disagro-frontend

# Versiones fijadas. Node de la misma familia que el backend (22.15.0 / Alpine 3.21).
ARG NODE_IMAGE=node:22.15.0-alpine3.21
ARG NGINX_IMAGE=nginx:1.28.0-alpine3.21


# ---------------------------------------------------------------------------
# 1. build — compila la SPA
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS build
WORKDIR /app

# Primero solo el manifiesto: si no cambian las dependencias, npm ci sale de caché
COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY src ./src

# Sin variables VITE_: la capa de API usa rutas relativas (/api/...) cuando
# VITE_API_URL no está definida, y en producción nginx sirve la app y la API
# desde el mismo origen. El .dockerignore deja fuera cualquier .env local, así
# que nada se incrusta en el bundle por accidente.
RUN npm run build


# ---------------------------------------------------------------------------
# 2. final — nginx con los estáticos
# ---------------------------------------------------------------------------
FROM ${NGINX_IMAGE} AS final

# Fuera la página de bienvenida y la configuración de ejemplo de nginx
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Dónde está el backend. Por defecto, el nombre de servicio que tendrá en el
# compose. No son secretos: se pueden sobreescribir con -e al ejecutar.
# NGINX_ENTRYPOINT_LOCAL_RESOLVERS hace que el entrypoint oficial exporte el DNS
# del contenedor en NGINX_LOCAL_RESOLVERS (en una red de Docker, 127.0.0.11).
ENV BACKEND_HOST=backend \
    BACKEND_PORT=3000 \
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1

# La plantilla la procesa el entrypoint oficial con envsubst al ARRANCAR, no al
# construir: el host del backend se decide en runtime, sin reconstruir la imagen.
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/cabeceras-seguridad.conf /etc/nginx/snippets/cabeceras-seguridad.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Privilegios: el proceso maestro arranca como root solo para abrir el puerto 80;
# los workers, que son los que atienden peticiones, corren como el usuario
# `nginx` (directiva `user nginx;` de la imagen oficial). Los ficheros servidos
# son de root y los workers solo pueden leerlos.
EXPOSE 80

# Comprueba que nginx sirve el index. A propósito NO consulta /api: si el backend
# cae, el frontend sigue sano (sirve la app y muestra el error), y el compose no
# debe reiniciarlo por un fallo que no es suyo.
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
