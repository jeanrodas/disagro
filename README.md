# Feria de Promociones Disagro — Backend

API de la plataforma de confirmación de asistencia a la feria de promociones de
Disagro. Los clientes confirman su asistencia, eligen servicios y productos, y
reciben códigos de descuento y un portafolio personalizado. Incluye un panel de
administración para ver los clientes confirmados y sus métricas.

El frontend vive en [`frontend/`](frontend/) como proyecto hermano.

## Stack

Node.js · TypeScript · Express 5 · PostgreSQL · Prisma 7 · JWT · bcrypt · Resend · Docker

## Requisitos

- Node.js 22 o superior
- Docker (para la base de datos)

## Puesta en marcha

```bash
cp .env.example .env     # y completa los valores
npm install
npm run db:up            # Postgres en Docker
npm run db:deploy        # aplica las migraciones
npm run db:seed          # catálogo (17 items), admin inicial y 6 clientes de demostración
npm run dev              # http://localhost:3000
```

### Clientes de demostración

El seed crea 6 clientes **de prueba** ([`prisma/seed/demo.data.ts`](prisma/seed/demo.data.ts))
para que el panel de administración no arranque vacío. Entre todos cubren cada caso del
sistema: 5% y 3% en servicios, 5% y 3% en productos, los dos descuentos a la vez y ningún
descuento, con códigos EMITIDOS y CANJEADOS. Son personas ficticias con correos de
dominios `.gt` que no existen.

- **Pasan por el flujo real.** Cada uno se valida con el mismo esquema que
  `POST /api/confirmar` y se crea con `confirmarAsistencia()`: precios de la base,
  `calcularDescuentos` y el generador de códigos. Los canjes usan `canjearCodigo()`.
- **Solo se crean los que faltan**, por email. Repetir el seed (ocurre en cada
  `docker compose up`) no duplica nada ni toca a ningún otro cliente; si un correo de demo
  ya lo usa otra persona, se deja como está.
- **`SEED_DEMO=false`** los omite, por ejemplo en un lanzamiento real donde no deben
  mezclarse con las métricas.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor con recarga automática |
| `npm run build` / `npm start` | Compila a `dist/` y lo ejecuta |
| `npm test` | Tests unitarios con vitest |
| `npm run typecheck` | Revisa tipos sin compilar |
| `npm run db:up` / `db:stop` | Postgres en Docker |
| `npm run db:migrate` / `db:deploy` | Migraciones en desarrollo / producción |
| `npm run db:seed` / `db:seed:admin` | Catálogo y admin / solo admin |
| `npm run db:studio` | Explorador de la base de datos |

## Endpoints

| Método y ruta | Quién | Para qué |
|---|---|---|
| `GET /health` | — | Estado del servicio y de la base de datos |
| `GET /api/items` | público | Catálogo con filtros `tipo`, `categoria` y `buscar` |
| `GET /api/categorias` | público | Categorías con su cantidad de items |
| `POST /api/confirmar` | público | Confirma asistencia, calcula descuentos y emite códigos |
| `GET /api/portafolio` | cliente | Portafolio del cliente de la sesión |
| `POST /api/sesion` | público | Canjea el token del enlace del correo por la cookie |
| `POST /api/codigos/canjear` | público | Marca un código como canjeado (una sola vez) |
| `POST /api/admin/login` / `logout` | público | Inicia y cierra la sesión del admin |
| `GET /api/admin/me` | admin | Admin autenticado |
| `GET /api/admin/clientes` | admin | Lista paginada con búsqueda |
| `GET /api/admin/clientes/:id` | admin | Detalle completo de un cliente |
| `GET /api/admin/metricas` | admin | Totales, ingreso potencial y top de items |

## Variables de entorno

Están documentadas en [`.env.example`](.env.example). Las que cambian por entorno:

- `APP_URL`: URL pública del frontend (CORS, enlace del correo, `portafolioUrl` del 409).
- `TRUST_PROXY`: cuántos proxies hay delante. `false` en local, `1` en producción.
- `MAIL_FROM` y `RESEND_API_KEY`: remitente y clave del correo. Sin clave, el correo
  se omite y queda anotado en el log; la confirmación funciona igual.
- `ADMIN_USER` y `ADMIN_PASSWORD`: solo las usa el seed del admin.

## Docker: toda la plataforma

```bash
cp .env.example .env          # y completa los valores
docker compose up -d --build
```

La app queda en **http://localhost:8090** (cámbialo con `PUERTO_APP`).

Cuatro servicios que arrancan en orden, garantizado por `depends_on`:

| Servicio | Qué hace | Arranca cuando |
|---|---|---|
| `postgres` | Base de datos, con volumen persistente | — |
| `migrate` | `prisma migrate deploy` y siembra el catálogo y el admin. **Termina** | `postgres` está *healthy* |
| `backend` | La API. No migra | `migrate` terminó **con éxito** |
| `frontend` | nginx: sirve la SPA y hace de proxy a `/api` | `backend` está *healthy* |

Desde cero (`down -v` incluido) tarda unos 35 segundos.

### Dos imágenes del backend, del mismo Dockerfile

- `--target final` (por defecto): **el servidor**. 247 MB. No lleva el CLI de Prisma.
- `--target migrate`: **las herramientas**. Lleva el CLI y `tsx` para el seed.

Migrar es una tarea puntual de despliegue, no algo que el servidor deba saber hacer.
Separarlas quita del runtime el CLI y todo lo que arrastra (Prisma Studio con
`react-dom`, `effect`, `typescript`), que el servidor no usa nunca: de 486 MB a 247 MB.
Además, con varias réplicas del backend, todas intentarían migrar a la vez.

**`migrate deploy`, no `migrate dev`:** `deploy` aplica las migraciones ya versionadas,
sin crear nuevas ni preguntar nada, y no hace nada si ya están aplicadas. `dev` es
interactivo, puede generar migraciones y, si detecta deriva, propone **resetear** la base.
El seed usa `upsert`, así que repetir `up` no duplica el catálogo.

### Comandos

| Comando | Qué hace |
|---|---|
| `docker compose up -d --build` | Levanta la plataforma |
| `docker compose logs -f` | Sigue los logs |
| `docker compose down` | La para y **conserva** los datos |
| `docker compose down -v` | La para y **BORRA la base de datos** |
| `npm run db:up` | Solo Postgres, para desarrollar sin Docker |

### Variables

El `.env` de la raíz sirve a dos entornos, y por eso hay variables con sufijo `_DOCKER`:
en desarrollo la base está en `localhost:5434` y la app en el 5175 de Vite, mientras que
dentro de la red de Docker la base es el servicio `postgres:5432` y la app la sirve nginx.

| Variable | Para qué |
|---|---|
| `PUERTO_APP` | Puerto del host donde queda la app (por defecto 8090) |
| `DATABASE_URL_DOCKER` | Conexión de los contenedores: host `postgres`, puerto 5432 |
| `APP_URL_DOCKER` | URL pública de la app. En producción, el dominio real |
| `JWT_SECRET`, `ADMIN_USER`, `ADMIN_PASSWORD`, `MAIL_FROM`, `RESEND_API_KEY` | Compartidas con el desarrollo |

`TRUST_PROXY` no se define en el `.env` para los contenedores: el compose lo fija en `1`,
porque el backend siempre va detrás de nginx.

### Ejecutar solo el backend, sin compose

```bash
docker build -t disagro-backend .
docker run -d -p 127.0.0.1:3000:3000 --env-file backend.env disagro-backend
```

Esta imagen **no migra**: espera a que la base acepte conexiones y arranca el servidor.
Prepara la base antes con la imagen de herramientas:

```bash
docker build --target migrate -t disagro-migrate .
docker run --rm --env-file backend.env disagro-migrate
```

### Producción: VPS con HTTPS (Caddy)

[`docker-compose.prod.yml`](docker-compose.prod.yml) añade un quinto servicio, **Caddy**,
que termina el TLS y es el único que publica puertos:

```
internet → Caddy (80/443, HTTPS) → nginx (80, red interna) → backend → postgres
```

```bash
# en el VPS, con el .env de producción copiado por un canal seguro
docker compose -f docker-compose.prod.yml --env-file .env.produccion up -d --build
```

- **HTTPS automático.** Caddy pide y renueva el certificado de Let's Encrypt y redirige
  HTTP a HTTPS sin configurarlo. Los certificados viven en un volumen: si se perdieran
  en cada reinicio, Let's Encrypt acabaría cortando por límite de peticiones.
- **Nada más queda expuesto.** nginx y Postgres pierden sus `ports`: solo se llega a
  ellos por la red interna de Docker.
- **`TRUST_PROXY=2`**, fijado en el propio compose. Con dos proxies delante (Caddy y
  nginx), el backend tiene que descontar dos saltos de `X-Forwarded-For` para leer la IP
  real del cliente. Con `1` leería la de Caddy y el rate limiting por IP contaría a todo
  el mundo como un solo visitante.
- **El `.env` de producción es otro fichero** (`.env.produccion`, tampoco versionado) con
  secretos propios: contraseña de Postgres, `JWT_SECRET` y `ADMIN_PASSWORD` nuevos, nunca
  los de desarrollo. Las variables están documentadas en [`.env.example`](.env.example).
- **La contraseña del admin se aplica al levantar.** El seed es idempotente: si
  `ADMIN_PASSWORD` cambió, actualiza el hash en el primer `up`. Rotarla es editar esa
  línea y volver a levantar.
- **Probar sin dominio.** Con `DOMINIO=localhost`, Caddy usa su CA interno (certificado
  autofirmado, sin Let's Encrypt) y la cadena completa se puede levantar en local:
  `DOMINIO=localhost PUERTO_HTTP=8080 PUERTO_HTTPS=8443 docker compose -f docker-compose.prod.yml …`
  y luego `curl -k https://localhost:8443/api/items`.

## Seguridad: alcance y limitaciones

### Lo que está implementado

| Medida | Dónde |
|---|---|
| Contraseñas con **bcrypt** (costo 12) | `src/lib/password.ts` |
| **JWT HS256** con emisor, audiencia y expiración de 8 h, verificando el algoritmo fijo | `src/lib/jwt-admin.ts` |
| **Cookies httpOnly** para las dos sesiones, `secure` en producción, `sameSite: lax`; la del admin acotada a `/api/admin` | `src/lib/sesion.ts`, `src/lib/jwt-admin.ts` |
| **Token de sesión del cliente guardado como SHA-256**: si se filtra la base, los hashes no sirven para entrar | `src/lib/sesion.ts` |
| **Defensa contra enumeración de usuarios**: el login responde lo mismo exista o no el usuario, y ejecuta bcrypt en ambos casos para que el tiempo no lo delate | `src/services/admin-auth.service.ts` |
| **Códigos con CSPRNG** (`crypto.randomBytes`) y muestreo por rechazo, sin sesgo | `src/domain/codigos.ts` |
| **Canje atómico**: un solo `UPDATE ... WHERE estado = 'EMITIDO'`, así dos peticiones simultáneas no pueden usar el mismo código | `src/services/codigos.service.ts` |
| **Validación y saneamiento de entradas con zod** en todos los endpoints, con errores por campo | `src/schemas/` |
| **Errores sin fugas**: al cliente solo le llega un mensaje; el detalle queda en el log del servidor | `src/middlewares/error.middleware.ts` |
| **helmet** y **CORS** restringido a `APP_URL` con credenciales | `src/app.ts` |
| **Rate limiting por IP** en login, confirmación y canje | `src/middlewares/rate-limit.middleware.ts` |
| **Secretos fuera del repositorio**: `.env` ignorado y `.env.example` con valores ficticios | `.gitignore`, `.env.example` |

**Rate limiting, valores y porqués:**

| Endpoint | Ventana | Límite | Razón |
|---|---|---|---|
| `POST /api/admin/login` | 15 min | 8 intentos **fallidos** | Blanco natural de la fuerza bruta. Los ingresos correctos no gastan cupo, así que el admin legítimo no se queda fuera por su propio uso. |
| `POST /api/confirmar` | 1 hora | 20 | Una persona confirma una vez; el margen cubre a varias que compartan la salida a internet (oficina o wifi de la feria) y corta la creación masiva. |
| `POST /api/codigos/canjear` | 10 min | 30 | Adivinar un código es muy improbable (31⁶ ≈ 887 millones); el límite evita intentarlo en masa. |

Se eligió **límite por IP y no bloqueo de cuenta**: con un único administrador, bloquear
la cuenta tras N fallos permitiría a cualquiera dejar fuera al admin real mandando
contraseñas equivocadas. El límite por IP frena el ataque sin abrir esa vía de
denegación de servicio.

### Lo que NO está y sería el siguiente paso

Esto es una prueba técnica y las medidas son proporcionadas a ese alcance. En un
sistema en producción faltaría:

- **Segundo factor (2FA/TOTP) para el admin.** Hoy una contraseña filtrada da acceso
  completo al panel.
- **Bloqueo o retardo progresivo por cuenta**, combinado con el límite por IP y con
  una forma de desbloqueo verificada, para cubrir ataques distribuidos desde muchas IPs.
- **HTTPS obligatorio con HSTS.** Se resuelve en el despliegue; sin TLS, las cookies
  de sesión viajan en claro. En producción `NODE_ENV=production` ya marca las cookies
  como `secure`.
- **Invalidación de sesiones del admin.** El JWT no tiene estado: al cerrar sesión se
  borra la cookie, pero un token copiado antes sigue sirviendo hasta que expira (8 h).
  Se resolvería con una versión de sesión en la tabla `Admin` o una lista de revocados.
- **Auditoría de accesos**: hoy no queda registro de quién entró al panel, desde dónde
  ni qué consultó.
- **Rotación de secretos** (`JWT_SECRET`, claves de API) y almacenamiento en un gestor
  de secretos en vez de un archivo `.env`.
- **WAF y protección ante denegación de servicio** a nivel de infraestructura; el rate
  limiting de la app no sustituye eso.
- **Contador de rate limiting compartido.** Vive en memoria del proceso: con varias
  réplicas cada una contaría por su lado, y haría falta un almacén común (Redis).
- **Rate limiting del canje pensado para el punto de venta.** Si en la feria un mismo
  dispositivo canjeara muchos códigos desde una sola IP, el límite de 30 cada 10
  minutos le quedaría corto: habría que exceptuar esa IP o, mejor, poner el canje
  detrás de la autenticación del punto de venta, que es como iría en un sistema real.
- **Protección CSRF explícita.** Hoy se apoya en `sameSite: lax` y en que las
  operaciones sensibles son `POST` con `Content-Type: application/json`; un token CSRF
  sería lo siguiente.

## Tests

```bash
npm test
```

88 tests unitarios sobre la lógica de dominio (descuentos, totales, generación de
códigos, canje, métricas), la validación y la plantilla del correo.
