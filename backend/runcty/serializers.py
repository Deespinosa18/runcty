from decimal import Decimal
from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from .indice import calcular_indice
from .models import Consentimiento, Corredor, Evaluacion, Incidente, Ruta, Zona


class CorredorSerializer(serializers.ModelSerializer):
    consentimiento_vigente = serializers.SerializerMethodField()

    class Meta:
        model = Corredor
        fields = ['id', 'alias', 'correo', 'activo', 'consentimiento_vigente', 'creado']
        read_only_fields = ['creado']

    def get_consentimiento_vigente(self, corredor) -> bool:
        return corredor.consentimientos.filter(aceptado=True).exists()


class ConsentimientoSerializer(serializers.ModelSerializer):
    corredor_alias = serializers.CharField(source='corredor.alias', read_only=True)

    class Meta:
        model = Consentimiento
        fields = ['id', 'corredor', 'corredor_alias', 'version', 'aceptado', 'fecha']
        read_only_fields = ['fecha']


class ZonaSerializer(serializers.ModelSerializer):
    total_rutas = serializers.IntegerField(source='rutas.count', read_only=True)

    class Meta:
        model = Zona
        fields = ['id', 'nombre', 'descripcion', 'total_rutas']


class RutaSerializer(serializers.ModelSerializer):
    zona_nombre = serializers.CharField(source='zona.nombre', read_only=True)
    km = serializers.DecimalField(max_digits=5, decimal_places=2, coerce_to_string=False, min_value=Decimal('0.1'))

    class Meta:
        model = Ruta
        fields = [
            'id', 'zona', 'zona_nombre', 'nombre', 'km', 'desnivel', 'superficie', 'dificultad',
            'iluminacion', 'afluencia', 'apoyo', 'incidentes_base',
        ]


class EvaluacionSerializer(serializers.ModelSerializer):
    """El índice NO se envía: el backend lo calcula con la regla de negocio."""

    ruta_nombre = serializers.CharField(source='ruta.nombre', read_only=True)
    corredor_alias = serializers.CharField(source='corredor.alias', read_only=True, default=None)

    class Meta:
        model = Evaluacion
        fields = ['id', 'ruta', 'ruta_nombre', 'corredor', 'corredor_alias', 'hora_salida', 'indice', 'fecha']
        read_only_fields = ['indice', 'fecha']

    def _con_indice(self, datos):
        ruta = datos.get('ruta', getattr(self.instance, 'ruta', None))
        hora = datos.get('hora_salida', getattr(self.instance, 'hora_salida', None))
        datos['indice'] = calcular_indice(ruta, hora)
        return datos

    def create(self, datos):
        return super().create(self._con_indice(datos))

    def update(self, instancia, datos):
        return super().update(instancia, self._con_indice(datos))


class IncidenteSerializer(serializers.ModelSerializer):
    autor_alias = serializers.CharField(source='autor.alias', read_only=True)
    zona_nombre = serializers.CharField(source='zona.nombre', read_only=True)
    tipo_texto = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_texto = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Incidente
        fields = [
            'id', 'autor', 'autor_alias', 'zona', 'zona_nombre', 'tipo', 'tipo_texto',
            'ubicacion', 'fecha', 'estado', 'estado_texto', 'creado',
        ]
        read_only_fields = ['creado']

    def validate_ubicacion(self, valor):
        valor = valor.strip()
        if not 3 <= len(valor) <= 120:
            raise serializers.ValidationError('La ubicación debe tener entre 3 y 120 caracteres.')
        return valor

    def validate_fecha(self, valor):
        if valor > timezone.now() + timedelta(minutes=1):
            raise serializers.ValidationError('La fecha del incidente no puede estar en el futuro.')
        return valor

    def validate_autor(self, autor):
        if not autor.consentimientos.filter(aceptado=True).exists():
            raise serializers.ValidationError(
                'El corredor debe aceptar el consentimiento antes de reportar incidentes.'
            )
        return autor


class RecomendacionEntradaSerializer(serializers.Serializer):
    zona = serializers.PrimaryKeyRelatedField(queryset=Zona.objects.all())
    km = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=Decimal('0.1'))
    hora = serializers.TimeField()
    corredor = serializers.PrimaryKeyRelatedField(queryset=Corredor.objects.all(), required=False)


class AporteSerializer(serializers.Serializer):
    factor = serializers.CharField()
    puntos = serializers.FloatField()


class RecomendacionSerializer(serializers.Serializer):
    ruta = RutaSerializer()
    indice = serializers.IntegerField()
    aportes = AporteSerializer(many=True)
    evaluacion = serializers.IntegerField()
