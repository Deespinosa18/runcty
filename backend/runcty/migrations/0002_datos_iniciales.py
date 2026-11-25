"""Datos de demostración del prototipo RUNCTY (rutas e índices sintéticos)."""
from django.db import migrations

ZONAS = [
    ('Jipiro', 'Parque recreacional y sus alrededores, al norte de Loja.'),
    ('La Tebaida', 'Sector residencial del sur de Loja.'),
]
RUTAS = [
    # zona, nombre, km, desnivel, superficie, dificultad, iluminación, afluencia, apoyo, incidentes_base
    ('Jipiro', 'Circuito del parque', '4.70', 22, 'PAVIMENTO', 'BAJA', 85, 80, 70, 1),
    ('Jipiro', 'Vuelta junto al río', '5.00', 35, 'MIXTA', 'MEDIA', 65, 70, 50, 0),
    ('Jipiro', 'Recorrido del sector norte', '5.30', 44, 'PAVIMENTO', 'MEDIA', 52, 45, 60, 2),
    ('Jipiro', 'Ruta larga de Jipiro', '8.20', 80, 'MIXTA', 'ALTA', 45, 40, 35, 1),
    ('La Tebaida', 'Circuito de La Tebaida', '3.90', 30, 'PAVIMENTO', 'BAJA', 75, 66, 60, 1),
]
CORREDORES = ['Corredor demo A', 'Corredor demo B']


def cargar(apps, schema_editor):
    Zona = apps.get_model('runcty', 'Zona')
    Ruta = apps.get_model('runcty', 'Ruta')
    Corredor = apps.get_model('runcty', 'Corredor')
    Consentimiento = apps.get_model('runcty', 'Consentimiento')
    zonas = {n: Zona.objects.get_or_create(nombre=n, defaults={'descripcion': d})[0] for n, d in ZONAS}
    for zona, nombre, km, desnivel, sup, dif, ilu, afl, apo, inc in RUTAS:
        Ruta.objects.get_or_create(
            zona=zonas[zona], nombre=nombre,
            defaults=dict(km=km, desnivel=desnivel, superficie=sup, dificultad=dif,
                          iluminacion=ilu, afluencia=afl, apoyo=apo, incidentes_base=inc),
        )
    for alias in CORREDORES:
        corredor, _ = Corredor.objects.get_or_create(alias=alias)
        Consentimiento.objects.get_or_create(corredor=corredor, version='1.0-demo')


def borrar(apps, schema_editor):
    apps.get_model('runcty', 'Ruta').objects.filter(nombre__in=[r[1] for r in RUTAS]).delete()


class Migration(migrations.Migration):
    dependencies = [('runcty', '0001_initial')]
    operations = [migrations.RunPython(cargar, borrar)]
