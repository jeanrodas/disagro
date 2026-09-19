# Frontend — Feria de Promociones Disagro

Interfaz web de la plataforma de confirmación de asistencia a la feria. Es una SPA que
consume la API del backend, que vive en la raíz de este repositorio (ver el
[README principal](../README.md)).

Construida con Vite, React y TypeScript, con Tailwind CSS para los estilos.

**No guarda ni decide nada por su cuenta**: descuentos, códigos, sesiones y métricas
salen de la API. La única regla que replica es la vista previa del descuento mientras
el cliente elige ([`src/lib/descuentos-preview.ts`](src/lib/descuentos-preview.ts)), y
solo para mostrarla: el cálculo que vale lo hace el backend al confirmar. Un test
comprueba que esa réplica coincide con las reglas del backend en las fronteras.

## Pantallas

| Ruta | Pantalla |
|---|---|
| `/` | Formulario de confirmación: datos del cliente, catálogo y el incentivo de descuento, que avanza a medida que el cliente elige |
| `/portafolio` | Portafolio del cliente: códigos de descuento y su selección. También abre el enlace del correo (`/portafolio#token=…`) |
| `/admin/login` | Acceso al panel de administración |
| `/admin` | Métricas y lista de clientes, con búsqueda, paginación y códigos canjeados/total |
| `/admin/clientes/:id` | Detalle de un cliente, con el estado de cada código |

## Desarrollo

Requisitos: Node.js 22 o superior y el backend corriendo en `http://localhost:3000`
(desde la raíz del repositorio: `npm run dev`).

```bash
npm install
npm run dev
```

Queda en **http://localhost:5175** (puerto fijo: el backend usa el 3000).

Las llamadas a `/api/...` las reenvía el proxy de desarrollo de Vite al backend (ver
[`vite.config.ts`](vite.config.ts)), así que no hay CORS de por medio y las cookies de
sesión funcionan igual que en producción.

Para levantar la plataforma completa sin instalar nada más que Docker, usa el
`docker compose` de la raíz: ver el [README principal](../README.md).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Revisa tipos (`tsc -b`) y compila a `dist/` |
| `npm run preview` | Sirve el resultado del build |
| `npm test` | Tests con vitest (61: vista previa de descuentos y formato) |
| `npm run lint` | Revisa el código con oxlint |

El chequeo de tipos que cuenta es `npm run build`: el `tsconfig.json` de la raíz del
frontend es de tipo *solution* (solo referencia a `tsconfig.app.json` y
`tsconfig.node.json`), así que un `tsc --noEmit` sobre él no revisa el código.

## Variables de entorno

Copia `.env.example` a `.env` solo si necesitas apuntar a un backend remoto:
`VITE_API_URL` es la URL pública de la API. En desarrollo se deja vacía y se usa el
proxy. Todo lo que empiece con `VITE_` termina dentro del bundle y es público: ahí
nunca van secretos.

## Docker (producción)

El [`Dockerfile`](Dockerfile) compila la app con Node y la sirve con nginx. La imagen
final (48,7 MB) no lleva Node, ni dependencias, ni código fuente: solo nginx y los
estáticos. En el proyecto completo la levanta el `docker-compose.yml` de la raíz; por
separado:

```bash
docker build -t disagro-frontend .
docker run -d -p 127.0.0.1:8080:80 -e BACKEND_HOST=backend disagro-frontend
```

nginx ([`nginx/default.conf.template`](nginx/default.conf.template)) hace tres cosas:

- **Sirve la SPA.** Cualquier ruta que no sea un fichero real devuelve `index.html`,
  así que recargar en `/admin` o `/portafolio` funciona. Un asset que no existe sí da 404.
- **Reenvía `/api/` al backend** con `Host`, `X-Forwarded-For` y `X-Forwarded-Proto`,
  para que funcionen las cookies y el rate limiting por IP. El backend cuenta los
  proxies con `TRUST_PROXY`: `1` en el compose de desarrollo, con solo nginx delante, y
  `2` en producción, con Caddy delante de nginx. Si ya llega un `X-Forwarded-Proto` (el
  `https` de Caddy), nginx lo conserva. Si el backend no responde, devuelve un 503 en JSON.
- **Caché y compresión.** Los assets con hash se cachean un año; `index.html`, nunca,
  para que un deploy nuevo se vea sin vaciar la caché. JS, CSS y JSON van con gzip.

El build no necesita variables `VITE_`: sin `VITE_API_URL`, la app llama a `/api/...`
en su mismo origen, que es justo lo que nginx atiende.

| Variable (runtime) | Por defecto | Qué es |
|---|---|---|
| `BACKEND_HOST` | `backend` | Nombre del contenedor o servicio del backend |
| `BACKEND_PORT` | `3000` | Puerto del backend dentro de la red de Docker |

## Estructura

```
src/
├── components/   Componentes reutilizables
├── pages/        Pantallas completas (admin/ para el panel)
├── lib/          Cliente de la API (apiFetch), vista previa de descuentos y utilidades
├── types/        Tipos de las respuestas del backend
└── index.css     Entrada de Tailwind, paleta de la feria y animaciones
nginx/            Configuración de nginx para la imagen de producción
```
