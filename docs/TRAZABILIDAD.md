# RUNCTY · Matriz de trazabilidad

Documento de requisitos: **Documento de Visión RUNCTY · Gacelas v1.0.0** (RF-01 a RF-10, RNF-01 a RNF-06).
Las evidencias (capturas) están en la carpeta `docs/evidencias/` con el número indicado.

| Requisito | Entidad o modelo | Endpoint de la API | Página de la app | Evidencia | Estado |
|---|---|---|---|---|---|
| RF-01 Selección de zona, distancia y hora (hasta 3 rutas, ±10 %) | Zona, Ruta | `POST /api/rutas/recomendar/` | `paginas/recomendar.page.ts` | Capturas 4 y 8 | Cumplido |
| RF-02 Índice de seguridad 0-100 con sus variables | Evaluacion (`runcty/indice.py`) | `POST /api/rutas/recomendar/` · CRUD `/api/evaluaciones/` | `recomendar.page.ts`, `paginas/evaluaciones/` | Capturas 8 y 16 | Cumplido |
| RF-03 Datos de la ruta (distancia, desnivel, superficie, dificultad) | Ruta | CRUD `/api/rutas/` | `paginas/rutas/` | Capturas 9 y 10 | Cumplido |
| RF-04 Ubicación compartida con contactos elegidos | ContactoConfianza | CRUD `/api/contactos/` | `paginas/contactos/` | Captura 12 | Parcial: contactos registrados; falta el envío de GPS en tiempo real |
| RF-05 Aviso por detención prolongada (umbral configurable) | ContactoConfianza (`minutos_detencion` 1-60) | CRUD `/api/contactos/` | `contactos-form.page.ts` | Captura 12 | Parcial: umbral guardado y validado; falta la notificación |
| RF-06 Reporte de incidentes (tipo, ubicación, hora) | Incidente | CRUD `/api/incidentes/` | `paginas/incidentes/` | Captura 11 | Cumplido |
| RF-07 Rutas sugeridas por clubes | Club, Ruta.club | CRUD `/api/clubes/` · `GET /api/rutas/?club=` | `paginas/clubes/`, `rutas-form.page.ts` | Capturas 9 y 13 | Cumplido |
| RF-08 Calificación de rutas de 1 a 5 | Calificacion | CRUD `/api/calificaciones/` | `paginas/calificaciones/` | Captura 14 | Cumplido |
| RF-09 Alertas de zona (3 o más confirmados en 7 días) | Incidente | `GET /api/zonas/{id}/alerta/` | `recomendar.page.ts` | Captura 15 | Cumplido (al recomendar, por zona) |
| RF-10 Botón de emergencia | — | — | — | — | No implementado |
| RNF-03 Consentimiento antes del primer uso | Consentimiento, Corredor | CRUD `/api/consentimientos/`, `/api/corredores/` | `paginas/consentimientos/`, `paginas/corredores/` | Capturas 11 y 17 | Parcial: obligatorio para reportar |
| RNF-06 Ruta recomendada en ≤ 4 toques | — | — | `inicio.page.ts` → `recomendar.page.ts` | Capturas 7 y 8 | Cumplido (2 toques) |

## Validaciones del backend (la app muestra el error 400 de Django)

- Porcentajes 0-100, distancia > 0, alias único, nombre de ruta único por zona.
- Un consentimiento por corredor y versión; el autor de un incidente debe tener consentimiento; la fecha del incidente no puede ser futura.
- Contacto con teléfono o correo; aviso entre 1 y 60 min; una calificación (1-5) por corredor y ruta.
- El índice lo calcula el servidor; los incidentes descartados no cuentan.
- No se elimina una zona ni un corredor con registros que dependen de él (400).

## Pruebas

`python manage.py test runcty` → 13 pruebas (CRUD con códigos 200/201/204/400/404, validaciones, índice, recomendación y alerta de zona).

## No implementado en esta versión

RF-04/RF-05 (envío de GPS en tiempo real y notificación) y RF-10 (botón de emergencia) requieren GPS en segundo plano y notificaciones push.
