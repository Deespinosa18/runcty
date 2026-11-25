from rest_framework.routers import DefaultRouter

from .views import (
    ConsentimientoViewSet, CorredorViewSet, EvaluacionViewSet, IncidenteViewSet, RutaViewSet,
    ZonaViewSet,
)

router = DefaultRouter()
router.register('corredores', CorredorViewSet)
router.register('consentimientos', ConsentimientoViewSet)
router.register('zonas', ZonaViewSet)
router.register('rutas', RutaViewSet)
router.register('evaluaciones', EvaluacionViewSet)
router.register('incidentes', IncidenteViewSet)

urlpatterns = router.urls
