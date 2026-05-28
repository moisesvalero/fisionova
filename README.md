# FisioNova Clinica - Recepcionista IA

Demo publica para portfolio tecnico: una web app de una clinica de fisioterapia ficticia con recepcionista IA, reserva de citas, agenda privada para el medico y confirmaciones por email.

![Captura de FisioNova Clinica](docs/images/home-screenshot.png)

## Demo

El proyecto simula la experiencia completa de una clinica real:

- Web publica con hero visual, secciones de clinica, tratamientos, equipo, contacto y politica de cookies.
- Chat de recepcion online integrado en la landing, con apertura ampliada tipo pop-up en escritorio.
- Recepcionista IA conectable a OpenAI mediante API Key.
- Flujo supervisado: la IA crea solicitudes pendientes y el humano confirma la cita desde el area privada.
- Agenda privada para el medico protegida por PIN.
- Calendario visual con citas precargadas para mostrar el funcionamiento.
- Envio de emails transaccionales preparado con Resend.
- Banner y pagina de politica de cookies.
- Responsive y efectos de aparicion para una presentacion mas premium.

> La clinica es ficticia. El objetivo es mostrar una prueba tecnica realista para portfolio, no vender un producto final en produccion.

## Stack

- Next.js 16 con App Router.
- React 19 y TypeScript estricto.
- Tailwind CSS 4.
- ESLint 9 y Prettier con plugin de Tailwind.
- Vitest, jsdom y Testing Library.
- Zod para validar variables de entorno.
- OpenAI API para la recepcionista IA.
- Resend para emails de confirmacion y cancelacion.
- Componentes tipo shadcn con `components.json`, `cn()` y `Button`.
- SEO base con metadata, sitemap, robots, manifest, Open Graph dinamico, `llms.txt` y JSON-LD.

## Funcionalidades tecnicas

- `src/app/api/receptionist/route.ts`: endpoint de chat para procesar mensajes de recepcion y consultar huecos disponibles.
- `src/app/api/appointments/route.ts`: solicitudes pendientes, confirmacion humana, cancelaciones y cambios.
- `src/app/api/email/route.ts`: endpoint preparado para enviar emails con Resend solo tras confirmacion humana.
- `src/components/receptionist/receptionist-experience.tsx`: experiencia principal de la landing, chat, modal, agenda y secciones visuales.
- `src/components/legal/cookie-banner.tsx`: banner de consentimiento con preferencias guardadas en `localStorage`.
- `src/app/medico/page.tsx`: vista privada de agenda del medico.
- `supabase/appointments.sql`: esquema opcional para usar Supabase como base de datos real.
- `src/lib/env.ts`: contrato de variables de entorno validado con Zod.

## Arranque rapido

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`.

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena solo lo que necesites para la demo.

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-nano

# Supabase opcional
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Area privada de agenda
DOCTOR_DASHBOARD_PIN=1234

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=onboarding@resend.dev
```

Sin `OPENAI_API_KEY`, la app puede seguir funcionando como demo visual, pero la respuesta IA real queda limitada. Sin `SUPABASE_SERVICE_ROLE_KEY`, las citas usan un store demo en memoria. Sin `RESEND_API_KEY`, el flujo de email queda preparado pero no envia correos reales.

## Flujo de citas

1. El paciente escribe a la recepcionista IA.
2. La IA propone huecos disponibles y recoge nombre, email y telefono.
3. La web crea una solicitud `pending`; todavia no se envia confirmacion.
4. El medico o recepcion entra al area privada, revisa la solicitud y pulsa `Confirmar`.
5. La cita pasa a `confirmed` y se envia el email de confirmacion.

Este enfoque evita que la IA cierre citas sensibles sin supervision humana.

## Scripts

```bash
npm run dev              # servidor local
npm run build            # build de produccion
npm run start            # servir build
npm run lint             # ESLint
npm run lint:fix         # ESLint con fixes
npm run check            # TypeScript sin emitir archivos
npm run format           # formatear con Prettier
npm run format:check     # comprobar formato
npm test                 # tests unitarios
npm run test:watch       # tests en modo watch
npm run audit            # auditoria de vulnerabilidades high+
npm run verify           # formato, lint, tipos, tests, build y audit
npm run design:audit     # auditoria visual con Impeccable
npm run agent:skills     # instalar/actualizar skills del agente
```

## Estructura

```text
src/
  app/             # rutas, layouts, APIs, sitemap, robots y estilos globales
  components/      # componentes reutilizables, UI, legal y experiencia principal
  config/          # configuracion del sitio
  lib/             # utilidades, env, SEO, servicios y helpers
  sanity/          # integracion opcional heredada de la plantilla base
  test/            # setup de tests
```

## Notas de portfolio

Este proyecto esta pensado para ensenar:

- Integracion de IA en una experiencia web realista.
- Diseno de producto para un negocio local, no una landing generica.
- Separacion entre web publica y area privada.
- Manejo de variables de entorno y servicios externos opcionales.
- Cuidado visual, responsive, accesibilidad basica, SEO y verificacion automatizada.

## Verificacion

Antes de publicar o entregar cambios:

```bash
npm run format:check
npm run lint
npm run check
npm test
npm run build
npm run design:audit
```

O una pasada completa:

```bash
npm run verify
```
