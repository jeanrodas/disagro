#!/bin/sh
# Prepara la base de datos y termina. Es el entrypoint de la imagen `migrate`,
# que en el compose es un servicio efímero: los demás esperan a que acabe bien.
#
#   1. prisma migrate deploy  — aplica las migraciones versionadas
#   2. seed                   — catálogo de la feria y admin inicial
#
# ¿Por qué `migrate deploy` y no `migrate dev`?
#   - deploy aplica, en orden, las migraciones YA creadas y versionadas en
#     prisma/migrations. No genera migraciones nuevas, no pregunta nada y no
#     modifica el esquema por su cuenta. Si ya están todas aplicadas no hace nada.
#   - dev es una herramienta de desarrollo: compara el schema con la base de datos,
#     puede CREAR migraciones nuevas, pide confirmación interactiva y, si detecta
#     deriva entre ambos, propone RESETEAR la base (borrando los datos). En
#     producción eso es inaceptable, y en un contenedor sin terminal ni siquiera
#     habría nadie para responder.
#
# El seed es idempotente (upsert por nombre), así que repetir `docker compose up`
# no duplica el catálogo ni crea admins de más.
#
# Reintentos: solo si el fallo es de conectividad. Una migración rota falla a la
# primera, en vez de quedar enmascarada tras quince reintentos.
set -eu

INTENTOS_MAX="${MIGRATE_INTENTOS_MAX:-15}"
ESPERA_SEGUNDOS="${MIGRATE_ESPERA_SEGUNDOS:-2}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[migrate] DATABASE_URL no está definida. Se inyecta en runtime (compose, -e o --env-file)." >&2
  exit 1
fi

intento=1
while :; do
  echo "[migrate] prisma migrate deploy (intento ${intento}/${INTENTOS_MAX})"

  if salida="$(./node_modules/.bin/prisma migrate deploy 2>&1)"; then
    echo "$salida"
    break
  fi
  echo "$salida" >&2

  # P1001: servidor inalcanzable · P1002: tiempo agotado · 57P03 / "starting up":
  # Postgres existe pero todavía está inicializando
  if ! echo "$salida" | grep -qE 'P1001|P1002|57P03|starting up'; then
    echo "[migrate] La migración falló por un motivo que NO es de conectividad: no se reintenta." >&2
    exit 1
  fi

  if [ "$intento" -ge "$INTENTOS_MAX" ]; then
    echo "[migrate] La base de datos no respondió tras ${INTENTOS_MAX} intentos." >&2
    exit 1
  fi

  echo "[migrate] La base de datos aún no responde; reintento en ${ESPERA_SEGUNDOS}s..."
  intento=$((intento + 1))
  sleep "$ESPERA_SEGUNDOS"
done

echo "[migrate] Sembrando el catálogo y el admin (idempotente)"
# El seed está en TypeScript y lo ejecuta tsx. Si falla, `set -e` termina con
# código distinto de cero y el compose no arranca el backend: mejor eso que un
# servidor en pie contra una base a medio preparar.
./node_modules/.bin/tsx prisma/seed/seed.ts

echo "[migrate] Base de datos lista"
