# syntax=docker/dockerfile:1
#
# Imagen de producción del backend (Node + Express + Prisma).
#
# Tres etapas: dos preparan cosas y solo la última se publica. Todo lo que se
# necesita para COMPILAR (TypeScript, tipos, vitest, tsx) se queda en las etapas
# intermedias y no llega a la imagen final.
#
# Construir:  docker build -t disagro-backend .
# Variables:  se inyectan en runtime, ver README (sección Docker). Ninguna se
#             hornea en la imagen.

# Versión fijada: la misma Node que en desarrollo, sobre Alpine (imagen ligera).
# Nunca 'latest': reconstruir mañana podría traer otra versión de Node sin aviso.
ARG NODE_IMAGE=node:22.15.0-alpine3.21


# ---------------------------------------------------------------------------
# 1. deps — solo dependencias de PRODUCCIÓN, instaladas en Linux
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app

# openssl: lo usa el motor de migraciones de Prisma sobre Alpine (musl)
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
# El postinstall ejecuta `prisma generate`, que necesita el schema y la config
# antes de instalar
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY prisma.config.ts ./

# --omit=dev: fuera TypeScript, tipos, vitest y tsx.
# Aquí se descarga el motor de migraciones de Prisma para linux-musl: el que hay en
# el node_modules del host es el de Windows y no serviría dentro del contenedor.
RUN npm ci --omit=dev && npm cache clean --force


# ---------------------------------------------------------------------------
# 2. build — dependencias completas, cliente de Prisma y compilación TypeScript
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS build
WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY prisma.config.ts ./

# npm ci ejecuta el postinstall: `prisma generate` corre DENTRO del contenedor.
# El .dockerignore excluye src/generated, así que nunca se cuela el del host.
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

# Mismo comando que en local: prisma generate && tsc. El cliente generado está en
# src/generated, así que tsc lo compila junto al resto dentro de dist/.
RUN npm run build


# ---------------------------------------------------------------------------
# 3. final — la imagen que se ejecuta
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS final
WORKDIR /app

# Usuario sin privilegios. Si alguien explotara la app, no sería root dentro del
# contenedor: ni instalar paquetes, ni tocar el sistema, ni reescribir el código.
RUN apk add --no-cache openssl \
 && addgroup -S app \
 && adduser -S -D -G app app

# Valores por defecto NO secretos: es una imagen de producción. Se pueden
# sobreescribir en runtime; los secretos nunca van aquí.
ENV NODE_ENV=production \
    PORT=3000 \
    # El CLI de Prisma consulta por red si hay versiones nuevas en cada ejecución;
    # en un contenedor que migra en cada arranque sobra
    CHECKPOINT_DISABLE=1

# Solo lo necesario para ejecutar. Los ficheros quedan propiedad de root y el
# usuario app solo puede leerlos: la app no puede modificar su propio código.
COPY --from=deps  /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json prisma.config.ts ./
# El schema y las migraciones se usan en el arranque (prisma migrate deploy)
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY prisma/migrations ./prisma/migrations

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
# sed: por si el script se editó en Windows y llegó con CRLF (el repo ya fuerza LF
# con .gitattributes, pero un editor puede cambiarlo en la copia de trabajo)
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
 && chmod 755 /usr/local/bin/docker-entrypoint.sh

USER app

EXPOSE 3000

# /health hace SELECT 1 contra Postgres: "healthy" significa app Y base de datos
# arriba. Se usa node (fetch nativo) en lugar de curl, que no viene en Alpine.
# start-period cubre los reintentos del entrypoint mientras Postgres arranca.
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health', { signal: AbortSignal.timeout(4000) }).then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
