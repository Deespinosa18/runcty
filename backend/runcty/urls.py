from rest_framework.routers import DefaultRouter

from .views import (
    CalificacionViewSet, ClubViewSet, ConsentimientoViewSet, ContactoConfianzaViewSet, CorredorViewSet, EvaluacionViewSet, IncidenteViewSet, RutaViewSet,
    ZonaViewSet,
)

router = DefaultRouter()
router.register('corredores', CorredorViewSet)
router.register('consentimientos', ConsentimientoViewSet)
router.register('contactos', ContactoConfianzaViewSet)
router.register('clubes', ClubViewSet)
router.register('zonas', ZonaViewSet)
router.register('rutas', RutaViewSet)
router.register('evaluaciones', EvaluacionViewSet)
router.register('calificaciones', CalificacionViewSet)
router.register('incidentes', IncidenteViewSet)

urlpatterns = router.urls
