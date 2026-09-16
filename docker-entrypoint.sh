#!/bin/sh
# Arranque del backend en el contenedor: primero migraciones, después el servidor.
#
# ¿Por qué `prisma migrate deploy` y no `prisma migrate dev`?
#   - deploy aplica, en orden, las migraciones YA creadas y versionadas en
#     prisma/migrations. No genera migraciones nuevas, no pregunta nada y no
#     modifica el esquema por su cuenta. Si ya están todas aplicadas no hace nada,
#     así que es seguro ejecutarlo en cada arranque.
#   - dev es una herramienta de desarrollo: compara el schema con la base de datos,
#     puede CREAR migraciones nuevas, pide confirmación interactiva y, si detecta
#     deriva entre ambos, propone RESETEAR la base de datos (borrando los datos).
#     En producción eso es inaceptable, y en un contenedor sin terminal ni siquiera
#     habría nadie para responder.
#
# Reintentos: el contenedor puede arrancar antes de que Postgres acepte conexiones
# (depends_on de compose, por defecto, solo espera a que el contenedor EXISTA, no a
# que esté listo). Se reintenta SOLO si el fallo es de conectividad; una migración
# rota falla a la primera, en vez de quedar enmascarada tras varios reintentos.
set -eu

INTENTOS_MAX="${MIGRATE_INTENTOS_MAX:-15}"
ESPERA_SEGUNDOS="${MIGRATE_ESPERA_SEGUNDOS:-2}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] DATABASE_URL no está definida. Se inyecta en runtime (docker run -e, --env-file o compose)." >&2
  exit 1
fi

intento=1
while :; do
  echo "[entrypoint] prisma migrate deploy (intento ${intento}/${INTENTOS_MAX})"

  if salida="$(./node_modules/.bin/prisma migrate deploy 2>&1)"; then
    echo "$salida"
    break
  fi
  echo "$salida" >&2

  # P1001: servidor inalcanzable (o host que aún no resuelve)
  # P1002: tiempo de conexión agotado
  # 57P03 / "starting up": Postgres existe pero todavía está inicializando
  if ! echo "$salida" | grep -qE 'P1001|P1002|57P03|starting up'; then
    echo "[entrypoint] La migración falló por un motivo que NO es de conectividad: no se reintenta." >&2
    exit 1
  fi

  if [ "$intento" -ge "$INTENTOS_MAX" ]; then
    echo "[entrypoint] La base de datos no respondió tras ${INTENTOS_MAX} intentos: el servidor no arranca." >&2
    exit 1
  fi

  echo "[entrypoint] La base de datos aún no responde; reintento en ${ESPERA_SEGUNDOS}s..."
  intento=$((intento + 1))
  sleep "$ESPERA_SEGUNDOS"
done

echo "[entrypoint] Migraciones al día; arrancando el servidor"

# exec: node REEMPLAZA al shell como proceso principal. Así recibe directamente el
# SIGTERM de `docker stop`, que server.ts usa para cerrar de forma ordenada. Sin
# exec, la señal le llegaría al shell y node moriría a los 10 s con un SIGKILL.
exec node dist/server.js
