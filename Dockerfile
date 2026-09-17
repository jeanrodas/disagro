# syntax=docker/dockerfile:1
#
# Imágenes del backend (Node + Express + Prisma).
#
# Produce DOS imágenes distintas a propósito:
#
#   --target final    (por defecto) El servidor. Ligero: solo dist/ y las
#                     dependencias de ejecución. NO lleva el CLI de Prisma.
#   --target migrate  Herramientas. Efímera: aplica las migraciones y siembra la
#                     base, y termina. Lleva el CLI de Prisma y tsx.
#
# Por qué separarlas: el CLI de Prisma arrastra sus propias dependencias (Prisma
# Studio con react-dom, effect, typescript...) que el servidor no usa nunca. Si
# viajaran en la imagen que queda corriendo, serían peso y superficie de ataque
# sin ninguna contrapartida. Migrar es una tarea de despliegue, puntual, no algo
# que el servidor tenga que saber hacer.
#
# Construir:  docker build -t disagro-backend .
#             docker build --target migrate -t disagro-migrate .
# Variables:  se inyectan en runtime, ver README. Ninguna se hornea en la imagen.

# Versión fijada: la misma Node que en desarrollo, sobre Alpine (imagen ligera).
# Nunca 'latest': reconstruir mañana podría traer otra versión de Node sin aviso.
ARG NODE_IMAGE=node:22.15.0-alpine3.21


# ---------------------------------------------------------------------------
# 1. deps-prod — solo las dependencias que necesita el servidor en ejecución
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS deps-prod
WORKDIR /app

COPY package.json package-lock.json ./

# --ignore-scripts: el postinstall del proyecto es `prisma generate`, y el CLI de
# Prisma es dependencia de desarrollo: aquí no está. No hace falta generar nada,
# porque el cliente ya viaja compilado dentro de dist/ desde la etapa de build.
#
# --omit=optional: sin esto el CLI de Prisma se cuela igualmente. @prisma/client
# lo declara como peer OPCIONAL, npm lo marca "devOptional" en el lockfile y
# --omit=dev por sí solo no descarta las opcionales. Con las dos banderas, el
# runtime se queda sin prisma, @prisma/engines ni Prisma Studio.
RUN npm ci --omit=dev --omit=optional --ignore-scripts && npm cache clean --force


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
# 3. migrate — imagen de herramientas, de un solo uso
# ---------------------------------------------------------------------------
# Aplica las migraciones y siembra la base; después termina. En el compose es un
# servicio efímero del que dependen los demás.
FROM ${NODE_IMAGE} AS migrate
WORKDIR /app

# openssl: lo usa el motor de migraciones de Prisma sobre Alpine (musl)
RUN apk add --no-cache openssl \
 && addgroup -S app \
 && adduser -S -D -G app app

ENV NODE_ENV=production \
    CHECKPOINT_DISABLE=1

COPY package.json package-lock.json ./
COPY prisma.config.ts tsconfig.json ./
# El schema, las migraciones y el seed (a diferencia del runtime, aquí sí hacen falta)
COPY prisma ./prisma

# Dependencias completas: el CLI de Prisma para migrar y tsx para ejecutar el
# seed, que está escrito en TypeScript.
#
# --include=dev es imprescindible aquí: con NODE_ENV=production (arriba), npm
# omite las dependencias de desarrollo, y tsx y el CLI de Prisma son justamente
# eso. Sin esta bandera la imagen de herramientas se queda sin herramientas.
RUN npm ci --include=dev

# El seed importa código de src/ (el cliente de Prisma y la validación del entorno)
COPY src ./src
RUN npx prisma generate

COPY docker-entrypoint-migrate.sh /usr/local/bin/docker-entrypoint-migrate.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint-migrate.sh \
 && chmod 755 /usr/local/bin/docker-entrypoint-migrate.sh

USER app
ENTRYPOINT ["docker-entrypoint-migrate.sh"]


# ---------------------------------------------------------------------------
# 4. final — la imagen que se ejecuta
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS final
WORKDIR /app

# Usuario sin privilegios. Si alguien explotara la app, no sería root dentro del
# contenedor: ni instalar paquetes, ni tocar el sistema, ni reescribir el código.
RUN addgroup -S app \
 && adduser -S -D -G app app

# Valores por defecto NO secretos: es una imagen de producción. Se pueden
# sobreescribir en runtime; los secretos nunca van aquí.
ENV NODE_ENV=production \
    PORT=3000

# Solo lo necesario para ejecutar. Aquí no están ni el schema ni las migraciones:
# esta imagen no migra. Los ficheros quedan propiedad de root y el usuario app
# solo puede leerlos: la app no puede modificar su propio código.
COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=build     /app/dist ./dist
COPY package.json ./

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
# sed: por si el script se editó en Windows y llegó con CRLF (el repo ya fuerza LF
# con .gitattributes, pero un editor puede cambiarlo en la copia de trabajo)
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
 && chmod 755 /usr/local/bin/docker-entrypoint.sh

USER app

EXPOSE 3000

# /health hace SELECT 1 contra Postgres: "healthy" significa app Y base de datos
# arriba. Se usa node (fetch nativo) en lugar de curl, que no viene en Alpine.
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health', { signal: AbortSignal.timeout(4000) }).then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
