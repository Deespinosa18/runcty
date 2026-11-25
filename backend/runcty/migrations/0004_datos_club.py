"""Datos de demostración: Club Gacelas sugiere el Circuito del parque (RF-07)."""
from django.db import migrations


def cargar(apps, schema_editor):
    Club = apps.get_model('runcty', 'Club')
    Ruta = apps.get_model('runcty', 'Ruta')
    club, _ = Club.objects.get_or_create(
        nombre='Club Gacelas', defaults={'ciudad': 'Loja', 'descripcion': 'Club de running Gacelas · UTPL'}
    )
    Ruta.objects.filter(nombre='Circuito del parque').update(club=club)


class Migration(migrations.Migration):
    dependencies = [('runcty', '0003_clubes_contactos_calificaciones')]
    operations = [migrations.RunPython(cargar, migrations.RunPython.noop)]
