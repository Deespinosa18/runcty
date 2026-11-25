"""Entidades de RUNCTY: rutas seguras para correr en Loja."""
from decimal import Decimal
from django.core.validators import MaxValueValidator, MinLengthValidator, MinValueValidator
from django.db import models

PORCENTAJE = [MinValueValidator(0), MaxValueValidator(100)]
VERSION_CONSENTIMIENTO = '1.0-demo'


class Corredor(models.Model):
    """Persona que usa la app para buscar rutas y reportar incidentes."""

    alias = models.CharField(max_length=60, unique=True, validators=[MinLengthValidator(3)])
    correo = models.EmailField(blank=True)
    activo = models.BooleanField(default=True)
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['alias']
        verbose_name = 'corredor'
        verbose_name_plural = 'corredores'

    def __str__(self):
        return self.alias


class Consentimiento(models.Model):
    """Aceptación del tratamiento de datos antes del primer uso."""

    corredor = models.ForeignKey(Corredor, on_delete=models.CASCADE, related_name='consentimientos')
    version = models.CharField(max_length=20, default=VERSION_CONSENTIMIENTO)
    aceptado = models.BooleanField(default=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']
        verbose_name = 'consentimiento'
        verbose_name_plural = 'consentimientos'
        constraints = [
            models.UniqueConstraint(fields=['corredor', 'version'], name='consentimiento_unico_por_version')
        ]

    def __str__(self):
        return f'{self.corredor} · v{self.version}'


class ContactoConfianza(models.Model):
    """Persona elegida por el corredor para ver su ubicación y recibir avisos (RF-04, RF-05)."""

    corredor = models.ForeignKey(Corredor, on_delete=models.CASCADE, related_name='contactos')
    nombre = models.CharField(max_length=80)
    telefono = models.CharField(max_length=20, blank=True)
    correo = models.EmailField(blank=True)
    minutos_detencion = models.PositiveSmallIntegerField(
        default=10, validators=[MinValueValidator(1), MaxValueValidator(60)],
        help_text='Aviso si el corredor permanece detenido más de estos minutos (RF-05)',
    )
    activo = models.BooleanField(default=True)

    class Meta:
        ordering = ['corredor__alias', 'nombre']
        verbose_name = 'contacto de confianza'
        verbose_name_plural = 'contactos de confianza'

    def __str__(self):
        return f'{self.nombre} (de {self.corredor})'


class Club(models.Model):
    """Club de running que publica rutas sugeridas (RF-07)."""

    nombre = models.CharField(max_length=80, unique=True)
    ciudad = models.CharField(max_length=60, default='Loja')
    descripcion = models.TextField(blank=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'club'
        verbose_name_plural = 'clubes'

    def __str__(self):
        return self.nombre


class Zona(models.Model):
    """Sector de Loja donde hay rutas (Jipiro, La Tebaida...)."""

    nombre = models.CharField(max_length=80, unique=True)
    descripcion = models.TextField(blank=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'zona'
        verbose_name_plural = 'zonas'

    def __str__(self):
        return self.nombre


class Ruta(models.Model):
    """Recorrido con sus factores de seguridad (0 a 100)."""

    class Superficie(models.TextChoices):
        PAVIMENTO = 'PAVIMENTO', 'Pavimento'
        MIXTA = 'MIXTA', 'Mixta'
        TIERRA = 'TIERRA', 'Tierra'

    class Dificultad(models.TextChoices):
        BAJA = 'BAJA', 'Baja'
        MEDIA = 'MEDIA', 'Media'
        ALTA = 'ALTA', 'Alta'

    zona = models.ForeignKey(Zona, on_delete=models.PROTECT, related_name='rutas')
    club = models.ForeignKey(
        Club, on_delete=models.SET_NULL, null=True, blank=True, related_name='rutas',
        help_text='Club que sugiere la ruta (RF-07)',
    )
    nombre = models.CharField(max_length=120)
    km = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(Decimal('0.1'))])
    desnivel = models.PositiveIntegerField(default=0, help_text='Metros de desnivel')
    superficie = models.CharField(max_length=10, choices=Superficie.choices, default=Superficie.PAVIMENTO)
    dificultad = models.CharField(max_length=5, choices=Dificultad.choices, default=Dificultad.MEDIA)
    iluminacion = models.PositiveSmallIntegerField(validators=PORCENTAJE)
    afluencia = models.PositiveSmallIntegerField(validators=PORCENTAJE)
    apoyo = models.PositiveSmallIntegerField(validators=PORCENTAJE, help_text='Puntos de apoyo cercanos')
    incidentes_base = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['zona__nombre', 'nombre']
        verbose_name = 'ruta'
        verbose_name_plural = 'rutas'
        constraints = [
            models.UniqueConstraint(fields=['zona', 'nombre'], name='ruta_unica_por_zona')
        ]

    def __str__(self):
        return f'{self.nombre} ({self.zona})'


class Evaluacion(models.Model):
    """Índice de seguridad (0-100) calculado para una ruta a una hora de salida."""

    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, related_name='evaluaciones')
    corredor = models.ForeignKey(
        Corredor, on_delete=models.SET_NULL, null=True, blank=True, related_name='evaluaciones'
    )
    hora_salida = models.TimeField()
    indice = models.PositiveSmallIntegerField(validators=PORCENTAJE)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha', '-id']
        verbose_name = 'evaluación'
        verbose_name_plural = 'evaluaciones'

    def __str__(self):
        return f'{self.ruta} · {self.indice}/100'


class Calificacion(models.Model):
    """Calificación de 1 a 5 que un corredor da a una ruta (RF-08)."""

    corredor = models.ForeignKey(Corredor, on_delete=models.CASCADE, related_name='calificaciones')
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, related_name='calificaciones')
    puntaje = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comentario = models.CharField(max_length=200, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha', '-id']
        verbose_name = 'calificación'
        verbose_name_plural = 'calificaciones'
        constraints = [
            models.UniqueConstraint(fields=['corredor', 'ruta'], name='una_calificacion_por_corredor_y_ruta')
        ]

    def __str__(self):
        return f'{self.ruta} · {self.puntaje}/5'


class Incidente(models.Model):
    """Reporte de un corredor sobre un problema en una zona."""

    class Tipo(models.TextChoices):
        ILUMINACION = 'ILUMINACION', 'Iluminación deficiente'
        OBSTACULO = 'OBSTACULO', 'Obstáculo en el camino'
        VIA = 'VIA', 'Vía deteriorada'

    class Estado(models.TextChoices):
        SIN_CONFIRMAR = 'SIN_CONFIRMAR', 'Sin confirmar'
        CONFIRMADO = 'CONFIRMADO', 'Confirmado'
        DESCARTADO = 'DESCARTADO', 'Descartado'

    autor = models.ForeignKey(Corredor, on_delete=models.PROTECT, related_name='incidentes')
    zona = models.ForeignKey(Zona, on_delete=models.PROTECT, related_name='incidentes')
    tipo = models.CharField(max_length=12, choices=Tipo.choices)
    ubicacion = models.CharField(max_length=120, validators=[MinLengthValidator(3)])
    fecha = models.DateTimeField()
    estado = models.CharField(max_length=14, choices=Estado.choices, default=Estado.SIN_CONFIRMAR)
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha', '-id']
        verbose_name = 'incidente'
        verbose_name_plural = 'incidentes'

    def __str__(self):
        return f'{self.get_tipo_display()} · {self.zona}'
