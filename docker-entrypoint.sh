#!/bin/sh
# Arranque del backend en el contenedor.
#
# Ya NO aplica migraciones: de eso se encarga el servicio efímero `migrate` del
# compose, que es el único que lleva el CLI de Prisma. Separarlo tiene dos
# motivos: la imagen que queda corriendo no carga con herramientas que no usa, y
# migrar deja de ser algo que ocurre en cada arranque de cada réplica (con dos
# contenedores del backend, ambos intentarían migrar a la vez).
#
# Lo único que hace aquí es esperar a que la base acepte conexiones. En el compose
# el orden ya está garantizado (depends_on), pero esta imagen también se ejecuta
# suelta, y así no se arranca contra una base que todavía no está.
set -eu

INTENTOS_MAX="${BD_INTENTOS_MAX:-15}"
ESPERA_SEGUNDOS="${BD_ESPERA_SEGUNDOS:-2}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] DATABASE_URL no está definida. Se inyecta en runtime (docker run -e, --env-file o compose)." >&2
  exit 1
fi

# Comprobación TCP simple: no consulta nada, solo mira si el puerto acepta
# conexiones. No necesita el CLI de Prisma ni ninguna dependencia extra.
puerto_abierto() {
  node -e '
    const { hostname, port } = new URL(process.env.DATABASE_URL);
    const socket = require("net").connect({ host: hostname, port: Number(port) || 5432 });
    socket.setTimeout(2000);
    socket.on("connect", () => { socket.end(); process.exit(0); });
    socket.on("error", () => process.exit(1));
    socket.on("timeout", () => { socket.destroy(); process.exit(1); });
  '
}

intento=1
while [ "$intento" -le "$INTENTOS_MAX" ]; do
  if puerto_abierto; then
    break
  fi
  echo "[entrypoint] La base de datos aún no acepta conexiones (intento ${intento}/${INTENTOS_MAX}); reintento en ${ESPERA_SEGUNDOS}s..."
  intento=$((intento + 1))
  sleep "$ESPERA_SEGUNDOS"
done

if [ "$intento" -gt "$INTENTOS_MAX" ]; then
  # Se arranca igual, a propósito: el servidor responde y /health informa de que
  # la base está caída, que es más útil que un contenedor que no levanta.
  echo "[entrypoint] La base de datos no respondió tras ${INTENTOS_MAX} intentos. Se arranca igual: /health lo reportará." >&2
fi

echo "[entrypoint] Arrancando el servidor"

# exec: node REEMPLAZA al shell como proceso principal. Así recibe directamente el
# SIGTERM de `docker stop`, que server.ts usa para cerrar de forma ordenada. Sin
# exec, la señal le llegaría al shell y node moriría a los 10 s con un SIGKILL.
exec node dist/server.js
