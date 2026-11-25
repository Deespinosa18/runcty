# RUNCTY · Rutas seguras para correr en Loja

Aplicación del reto construida con la arquitectura del curso (guías 03 y 04, apartado 14):

| Capa | Tecnología | Carpeta |
|---|---|---|
| Backend | Django 5.2 + Django REST Framework + MySQL 8.4 (puerto 3307) | `backend/` |
| Frontend web | Angular 22 + Ionic 9 | `frontend/src/app/` (`core/` y `paginas/`) |
| Android | Capacitor 8 (`com.runcty.app`) | `frontend/android/` |

## Entidades (CRUD completo en API, admin y app)

| Entidad | Endpoint | Páginas |
|---|---|---|
| Corredor | `/api/corredores/` | `paginas/corredores/` |
| Consentimiento | `/api/consentimientos/` | `paginas/consentimientos/` |
| Zona | `/api/zonas/` | `paginas/zonas/` |
| Ruta | `/api/rutas/` | `paginas/rutas/` |
| Evaluación | `/api/evaluaciones/` | `paginas/evaluaciones/` |
| Incidente | `/api/incidentes/` | `paginas/incidentes/` |

Regla de negocio: `POST /api/rutas/recomendar/` (página **Recomendar rutas**) devuelve las 3 rutas
de la zona a ±0,5 km con mayor **índice de seguridad** (0-100) y guarda cada cálculo como Evaluación.
Ponderación (`backend/runcty/indice.py`): iluminación 30 %, afluencia 20 %, incidentes 25 %
(últimos 30 días), puntos de apoyo 15 % y hora de salida 10 %.

Validaciones: porcentajes 0-100, km > 0, alias y ruta únicos, un consentimiento por versión,
el autor de un incidente debe tener consentimiento aceptado, la fecha del incidente no puede ser futura,
no se puede borrar una zona o un corredor con registros que dependan de él (400).

## Ejecutar

```powershell
# Backend
Set-Location backend; .\.venv\Scripts\Activate.ps1
python manage.py runserver 0.0.0.0:8000      # admin: /admin/  · API: /api/docs/
python manage.py test runcty                 # 9 pruebas

# Web
Set-Location frontend; npx.cmd ng serve --port 8100   # http://localhost:8100

# Android
npm.cmd run build; npx.cmd cap sync android; npx.cmd cap open android
```

Las credenciales están en `backend/.env` (no se sube a Git; ver `backend/.env.example`).
