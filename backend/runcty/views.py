from decimal import Decimal

from django.db.models import ProtectedError
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .indice import alerta_zona, aportes, calcular_indice, incidentes_recientes
from .models import (
    Calificacion, Club, Consentimiento, ContactoConfianza, Corredor, Evaluacion, Incidente, Ruta, Zona,
)
from .serializers import (
    AlertaZonaSerializer, CalificacionSerializer, ClubSerializer, ConsentimientoSerializer,
    ContactoConfianzaSerializer, CorredorSerializer, EvaluacionSerializer, IncidenteSerializer,
    RecomendacionEntradaSerializer, RecomendacionSerializer, RutaSerializer, ZonaSerializer,
)


class ProtegidoMixin:
    """Devuelve 400 con un mensaje claro si el registro está en uso (on_delete=PROTECT)."""

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {'detail': 'No se puede eliminar: hay otros registros que dependen de este.'},
                status=status.HTTP_400_BAD_REQUEST,
            )


class CorredorViewSet(ProtegidoMixin, viewsets.ModelViewSet):
    """CRUD de corredores."""

    queryset = Corredor.objects.all()
    serializer_class = CorredorSerializer
    filterset_fields = ['activo']
    search_fields = ['alias', 'correo']
    ordering_fields = ['alias', 'creado']


class ConsentimientoViewSet(viewsets.ModelViewSet):
    """CRUD de consentimientos (uno por corredor y versión)."""

    queryset = Consentimiento.objects.select_related('corredor')
    serializer_class = ConsentimientoSerializer
    filterset_fields = ['corredor', 'version', 'aceptado']


class ContactoConfianzaViewSet(viewsets.ModelViewSet):
    """CRUD de contactos de confianza de cada corredor (RF-04, RF-05)."""

    queryset = ContactoConfianza.objects.select_related('corredor')
    serializer_class = ContactoConfianzaSerializer
    filterset_fields = ['corredor', 'activo']
    search_fields = ['nombre']


class ClubViewSet(viewsets.ModelViewSet):
    """CRUD de clubes de running (RF-07)."""

    queryset = Club.objects.all()
    serializer_class = ClubSerializer
    search_fields = ['nombre', 'ciudad']


class ZonaViewSet(ProtegidoMixin, viewsets.ModelViewSet):
    """CRUD de zonas de Loja y alerta de zona (RF-09)."""

    queryset = Zona.objects.all()
    serializer_class = ZonaSerializer
    search_fields = ['nombre']

    @extend_schema(responses=AlertaZonaSerializer)
    @action(detail=True, methods=['get'])
    def alerta(self, request, pk=None):
        """RF-09: alerta si hay 3 o más incidentes confirmados en los últimos 7 días."""
        return Response(alerta_zona(self.get_object().id))


class RutaViewSet(ProtegidoMixin, viewsets.ModelViewSet):
    """CRUD de rutas y recomendación de las 3 rutas más seguras."""

    queryset = Ruta.objects.select_related('zona', 'club')
    serializer_class = RutaSerializer
    filterset_fields = ['zona', 'club', 'dificultad', 'superficie']
    search_fields = ['nombre']
    ordering_fields = ['nombre', 'km']

    @extend_schema(request=RecomendacionEntradaSerializer, responses=RecomendacionSerializer(many=True))
    @action(detail=False, methods=['post'])
    def recomendar(self, request):
        """RF-01/RF-02: hasta 3 rutas de la zona con distancia dentro de ±10 % del objetivo,
        ordenadas por índice de seguridad.

        Cada recomendación se guarda como una Evaluación.
        """
        entrada = RecomendacionEntradaSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        zona, km, hora = (entrada.validated_data[c] for c in ('zona', 'km', 'hora'))
        corredor = entrada.validated_data.get('corredor')
        recientes = incidentes_recientes(zona.id)
        margen = km * Decimal('0.10')
        rutas = Ruta.objects.filter(
            zona=zona, km__gte=km - margen, km__lte=km + margen
        ).select_related('zona', 'club')
        calculadas = sorted(
            ((ruta, calcular_indice(ruta, hora, recientes)) for ruta in rutas),
            key=lambda par: (-par[1], abs(par[0].km - km), par[0].id),
        )[:3]
        resultado = []
        for ruta, indice in calculadas:
            evaluacion = Evaluacion.objects.create(
                ruta=ruta, corredor=corredor, hora_salida=hora, indice=indice
            )
            resultado.append({
                'ruta': ruta,
                'indice': indice,
                'aportes': [{'factor': f, 'puntos': p} for f, p in aportes(ruta, hora, recientes)],
                'evaluacion': evaluacion.id,
            })
        return Response(RecomendacionSerializer(resultado, many=True).data)


class EvaluacionViewSet(viewsets.ModelViewSet):
    """CRUD de evaluaciones. El índice lo calcula el backend."""

    queryset = Evaluacion.objects.select_related('ruta', 'corredor')
    serializer_class = EvaluacionSerializer
    filterset_fields = ['ruta', 'corredor']
    ordering_fields = ['fecha', 'indice']


class CalificacionViewSet(viewsets.ModelViewSet):
    """CRUD de calificaciones de rutas de 1 a 5 (RF-08)."""

    queryset = Calificacion.objects.select_related('corredor', 'ruta')
    serializer_class = CalificacionSerializer
    filterset_fields = ['ruta', 'corredor']
    ordering_fields = ['fecha', 'puntaje']


class IncidenteViewSet(viewsets.ModelViewSet):
    """CRUD de incidentes reportados por los corredores."""

    queryset = Incidente.objects.select_related('autor', 'zona')
    serializer_class = IncidenteSerializer
    filterset_fields = ['zona', 'tipo', 'estado', 'autor']
    search_fields = ['ubicacion']
    ordering_fields = ['fecha']
