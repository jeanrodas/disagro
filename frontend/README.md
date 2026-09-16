# Frontend — Feria de Promociones Disagro

Interfaz web de la plataforma de confirmación de asistencia a la feria. Consume la
API del backend que vive en la raíz de este repositorio (Express + Prisma + Postgres).

Construido con Vite, React y TypeScript, con Tailwind CSS para los estilos.

## Requisitos

- Node.js 22 o superior
- El backend corriendo en `http://localhost:3000` (desde la raíz del repo: `npm run dev`)

## Cómo correrlo

```bash
npm install
npm run dev
```

Queda en http://localhost:5175 (puerto fijo: el backend usa el 3000).

Las llamadas a `/api/...` las reenvía el proxy de desarrollo de Vite al backend
(ver `vite.config.ts`), así que no hay CORS de por medio y las cookies de sesión
funcionan igual que en producción.

## Otros comandos

| Comando | Qué hace |
|---|---|
| `npm run build` | Revisa tipos y compila a `dist/` |
| `npm run preview` | Sirve el resultado del build |
| `npm run lint` | Revisa el código con oxlint |

## Variables de entorno

Copia `.env.example` a `.env` solo si necesitas apuntar a un backend remoto:
`VITE_API_URL` es la URL pública de la API. En desarrollo se deja vacía y se usa el
proxy. Todo lo que empiece con `VITE_` termina dentro del bundle y es público: ahí
nunca van secretos.

## Docker (producción)

El [`Dockerfile`](Dockerfile) compila la app con Node y la sirve con nginx. La imagen
final no lleva Node, ni dependencias, ni código fuente: solo nginx y los estáticos.

```bash
docker build -t disagro-frontend .
docker run -d -p 127.0.0.1:8080:80 -e BACKEND_HOST=backend disagro-frontend
```

nginx ([`nginx/default.conf.template`](nginx/default.conf.template)) hace tres cosas:

- **Sirve la SPA.** Cualquier ruta que no sea un fichero real devuelve `index.html`,
  así que recargar en `/admin` o `/portafolio` funciona. Un asset que no existe sí da 404.
- **Reenvía `/api/` al backend** con `Host`, `X-Forwarded-For` y `X-Forwarded-Proto`,
  para que funcionen las cookies y el rate limiting por IP (el backend debe tener
  `TRUST_PROXY=1`). Si el backend no responde, devuelve un 503 en JSON.
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
├── pages/        Pantallas completas
├── lib/          Cliente de la API (apiFetch) y utilidades
├── types/        Tipos de las respuestas del backend
└── index.css     Entrada de Tailwind y paleta de la feria
```
