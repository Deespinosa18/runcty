from django.contrib import admin

from .models import Consentimiento, Corredor, Evaluacion, Incidente, Ruta, Zona


class ConsentimientoInline(admin.TabularInline):
    model = Consentimiento
    extra = 0
    readonly_fields = ('fecha',)


class RutaInline(admin.TabularInline):
    model = Ruta
    extra = 0
    fields = ('nombre', 'km', 'dificultad', 'iluminacion', 'afluencia', 'apoyo')


@admin.register(Corredor)
class CorredorAdmin(admin.ModelAdmin):
    list_display = ('alias', 'correo', 'activo', 'creado')
    list_filter = ('activo',)
    search_fields = ('alias', 'correo')
    inlines = [ConsentimientoInline]


@admin.register(Consentimiento)
class ConsentimientoAdmin(admin.ModelAdmin):
    list_display = ('corredor', 'version', 'aceptado', 'fecha')
    list_filter = ('version', 'aceptado')


@admin.register(Zona)
class ZonaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'descripcion')
    search_fields = ('nombre',)
    inlines = [RutaInline]


@admin.register(Ruta)
class RutaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'zona', 'km', 'dificultad', 'iluminacion', 'afluencia', 'apoyo')
    list_filter = ('zona', 'dificultad', 'superficie')
    search_fields = ('nombre',)


@admin.register(Evaluacion)
class EvaluacionAdmin(admin.ModelAdmin):
    list_display = ('ruta', 'corredor', 'hora_salida', 'indice', 'fecha')
    list_filter = ('ruta__zona',)
    readonly_fields = ('indice',)


@admin.register(Incidente)
class IncidenteAdmin(admin.ModelAdmin):
    list_display = ('tipo', 'zona', 'ubicacion', 'autor', 'fecha', 'estado')
    list_filter = ('estado', 'tipo', 'zona')
    search_fields = ('ubicacion',)
