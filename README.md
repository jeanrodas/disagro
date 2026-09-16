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
npm run db:seed          # catálogo (17 items) y admin inicial
npm run dev              # http://localhost:3000
```

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
