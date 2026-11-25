"""Regla de negocio: índice de seguridad de una ruta (0-100).

Es la misma ponderación del prototipo RUNCTY:
iluminación 30 %, afluencia 20 %, incidentes 25 %, puntos de apoyo 15 % y hora de salida 10 %.
"""
from datetime import timedelta
from math import floor

from django.utils import timezone

from .models import Incidente


def incidentes_recientes(zona_id, dias=30):
    """Incidentes de la zona en los últimos `dias` días (los descartados no cuentan)."""
    desde = timezone.now() - timedelta(days=dias)
    return (
        Incidente.objects.filter(zona_id=zona_id, fecha__gte=desde)
        .exclude(estado=Incidente.Estado.DESCARTADO)
        .count()
    )


def aportes(ruta, hora_salida, recientes):
    """Devuelve la lista [(factor, puntos)] que suma el índice."""
    tramo = 90 if 7 <= hora_salida.hour < 18 else 45
    impacto_incidentes = max(0, 100 - 16 * ruta.incidentes_base - 6 * recientes)
    return [
        ('Iluminación', round(ruta.iluminacion * 0.30, 1)),
        ('Afluencia', round(ruta.afluencia * 0.20, 1)),
        ('Incidentes', round(impacto_incidentes * 0.25, 1)),
        ('Puntos de apoyo', round(ruta.apoyo * 0.15, 1)),
        ('Hora de salida', round(tramo * 0.10, 1)),
    ]


def calcular_indice(ruta, hora_salida, recientes=None):
    if recientes is None:
        recientes = incidentes_recientes(ruta.zona_id)
    total = sum(valor for _, valor in aportes(ruta, hora_salida, recientes))
    return min(100, max(0, floor(total + 0.5)))
