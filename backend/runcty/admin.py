from django.contrib import admin

from .models import (
    Calificacion, Club, Consentimiento, ContactoConfianza, Corredor, Evaluacion, Incidente, Ruta, Zona,
)


class ConsentimientoInline(admin.TabularInline):
    model = Consentimiento
    extra = 0
    readonly_fields = ('fecha',)


class ContactoInline(admin.TabularInline):
    model = ContactoConfianza
    extra = 0


class RutaInline(admin.TabularInline):
    model = Ruta
    extra = 0
    fields = ('nombre', 'km', 'dificultad', 'iluminacion', 'afluencia', 'apoyo')


@admin.register(Corredor)
class CorredorAdmin(admin.ModelAdmin):
    list_display = ('alias', 'correo', 'activo', 'creado')
    list_filter = ('activo',)
    search_fields = ('alias', 'correo')
    inlines = [ConsentimientoInline, ContactoInline]


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
    list_display = ('nombre', 'zona', 'club', 'km', 'dificultad', 'iluminacion', 'afluencia', 'apoyo')
    list_filter = ('zona', 'club', 'dificultad', 'superficie')
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


@admin.register(ContactoConfianza)
class ContactoConfianzaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'corredor', 'telefono', 'correo', 'minutos_detencion', 'activo')
    list_filter = ('activo',)


@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'ciudad')
    search_fields = ('nombre',)


@admin.register(Calificacion)
class CalificacionAdmin(admin.ModelAdmin):
    list_display = ('ruta', 'corredor', 'puntaje', 'fecha')
    list_filter = ('puntaje', 'ruta')
