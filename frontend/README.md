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

## Estructura

```
src/
├── components/   Componentes reutilizables
├── pages/        Pantallas completas
├── lib/          Cliente de la API (apiFetch) y utilidades
├── types/        Tipos de las respuestas del backend
└── index.css     Entrada de Tailwind y paleta de la feria
```
