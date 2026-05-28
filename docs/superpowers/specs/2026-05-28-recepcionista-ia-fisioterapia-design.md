# Recepcionista IA para clinica de fisioterapia

Fecha: 2026-05-28

## Objetivo

Crear una web app de portfolio para una clinica de fisioterapia con una recepcionista IA capaz de atender consultas y gestionar citas desde una interfaz de chat. La clinica sera de demostracion, pero la agenda debe comportarse como una agenda funcional: mostrar disponibilidad, registrar citas confirmadas, permitir cambios/cancelaciones y servir para capturas o demos reales.

La primera version debe funcionar sin costes obligatorios. OpenAI sera el proveedor IA principal cuando exista API key y la aplicacion tendra fallback local si no hay clave, si se supera el limite o si falla la llamada.

## Alcance de la primera version

La recepcionista cubrira estas acciones:

- Pedir cita.
- Cambiar cita.
- Cancelar cita.
- Consultar precios.
- Consultar tratamientos.
- Consultar horarios, ubicacion y contacto.
- Enviar o simular emails transaccionales al confirmar, cambiar o cancelar una cita.

No se conectara todavia a una clinica real, Supabase, Google Calendar, CRM ni pasarela de pago. Esos puntos quedan preparados como evolucion posterior.

## Experiencia de usuario

La primera pantalla sera una experiencia de producto, no una landing generica. Debe comunicar rapidamente que se trata de una clinica de fisioterapia moderna y poner la recepcionista IA como pieza protagonista.

La UI tendra tres zonas principales:

- Informacion breve de la clinica: nombre, propuesta, tratamientos principales, horario y contacto.
- Chat de recepcionista IA: tono cercano, calido y fiable.
- Panel de agenda: vista de dias, horas, profesionales, tratamientos, estados y citas confirmadas.

El usuario podra escribir mensajes naturales como "quiero cita el viernes por la tarde" o "cuanto cuesta una sesion de fisio deportiva". La recepcionista preguntara solo lo imprescindible, proponera huecos disponibles y confirmara la cita con un resumen claro.

## Agenda funcional de demo

La agenda se implementara como un modulo local de dominio con datos iniciales de ejemplo y persistencia en `localStorage`.

Debe incluir:

- Profesionales de fisioterapia.
- Tratamientos con duracion y precio.
- Horarios disponibles.
- Citas existentes de demo.
- Citas creadas durante la sesion.
- Estados basicos: disponible, reservado, cancelado.
- Boton para restablecer la demo.

La agenda no sera solo decorativa: la recepcionista debe consultar disponibilidad real dentro de estos datos antes de proponer una hora, y las acciones confirmadas deben reflejarse en la vista de agenda.

## IA y proveedores

La app tendra un endpoint server-side en `src/app/api/receptionist/route.ts` para evitar exponer claves en el cliente.

Proveedor principal:

- OpenAI mediante `OPENAI_API_KEY`.
- Modelo configurable con `OPENAI_MODEL`.
- Modelo recomendado inicial: uno de bajo coste y cubierto por la cuota gratuita disponible en la cuenta, por ejemplo `gpt-5.4-nano` si esta disponible.

Fallback:

- Si falta `OPENAI_API_KEY`, falla la llamada o se alcanza un limite, se usara una respuesta local basada en reglas.
- El fallback debe mantener la demo util: responder preguntas frecuentes, proponer huecos y confirmar/cancelar/modificar citas con la misma agenda local.

Groq:

- Se deja fuera de la primera implementacion para no aumentar complejidad.
- La arquitectura debe permitir anadirlo despues como segundo proveedor si se desea.

## Emails transaccionales

La app integrara Resend de forma opcional.

Variables esperadas:

- `RESEND_API_KEY`.
- `RESEND_FROM_EMAIL`.

Eventos:

- Confirmacion de cita.
- Modificacion de cita.
- Cancelacion de cita.

Si falta la configuracion de Resend, la app no debe fallar. En su lugar, mostrara o registrara una simulacion de email enviado para que el portfolio pueda demostrar el flujo completo sin coste ni dominio verificado.

## Arquitectura propuesta

Archivos y modulos esperados:

- `src/app/page.tsx`: pagina principal de la clinica.
- `src/components/receptionist/`: componentes del chat, mensajes, estado de cita y panel de agenda.
- `src/lib/receptionist/`: tipos, tratamientos, agenda, acciones y fallback local.
- `src/app/api/receptionist/route.ts`: endpoint de IA.
- `src/app/api/email/route.ts` o modulo server equivalente: envio/simulacion de email.
- `src/config/site.ts`: nombre, descripcion, keywords y SEO del proyecto.
- `.env.example`: contrato de variables `OPENAI_API_KEY`, `OPENAI_MODEL`, `RESEND_API_KEY` y `RESEND_FROM_EMAIL`.

Las claves nunca se expondran al cliente. Las acciones que dependan de OpenAI o Resend se ejecutaran server-side.

## Datos y flujo

Flujo de reserva:

1. Usuario pide una cita en lenguaje natural.
2. La recepcionista identifica intencion y datos disponibles.
3. Si faltan datos necesarios, pregunta por ellos.
4. Consulta la agenda local.
5. Propone huecos disponibles.
6. El usuario elige una opcion.
7. Se crea la cita en la agenda local.
8. Se envia o simula email de confirmacion.
9. El chat y el panel de agenda muestran el resultado.

Flujo de cambio:

1. Usuario pide cambiar una cita.
2. La recepcionista localiza la cita por datos aportados.
3. Propone nuevos huecos.
4. Actualiza la cita y envia o simula email de modificacion.

Flujo de cancelacion:

1. Usuario pide cancelar una cita.
2. La recepcionista confirma la cita afectada.
3. Marca la cita como cancelada y envia o simula email de cancelacion.

## Manejo de errores

La aplicacion debe degradar con claridad:

- Sin OpenAI: usar modo demo local.
- Error de OpenAI: mostrar respuesta amable y seguir en modo local.
- Sin Resend: simular email.
- Error de Resend: mantener la cita y mostrar aviso de que el email no se envio.
- Datos insuficientes: la recepcionista pregunta de forma concreta.

## Testing y verificacion

Se anadiran tests para la logica de agenda y, si encaja con la estructura final, para el fallback local de recepcionista.

Antes de cerrar la implementacion se ejecutaran las comprobaciones disponibles del proyecto:

- `npm run format:check`
- `npm run lint`
- `npm run check`
- `npm test`
- `npm run build`

`npm run design:audit` se ejecutara si el cambio visual final lo justifica y la herramienta esta disponible.

## Criterios de aceptacion

- La home presenta una clinica de fisioterapia creible y profesional.
- El chat de recepcionista IA es el foco principal de la experiencia.
- La recepcionista puede reservar, cambiar y cancelar citas.
- La recepcionista responde precios, tratamientos, horarios, ubicacion y contacto.
- La agenda visible se actualiza al confirmar, cambiar o cancelar citas.
- Las citas persisten en el navegador mediante `localStorage`.
- OpenAI funciona si hay `OPENAI_API_KEY`.
- La demo sigue funcionando sin OpenAI mediante fallback local.
- Resend envia emails si esta configurado.
- La demo simula emails si Resend no esta configurado.
- No se exponen claves privadas en el cliente.
- Las comprobaciones relevantes pasan o se documenta claramente cualquier bloqueo.

## Fuera de alcance

- Autenticacion de usuarios.
- Panel privado de administracion.
- Conexion con Google Calendar.
- Base de datos real.
- Pagos online.
- Multi-clinica real.
- Voz en tiempo real.
- Recordatorios automaticos programados.

