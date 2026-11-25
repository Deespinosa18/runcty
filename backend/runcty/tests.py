from datetime import time, timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .indice import calcular_indice
from .models import Consentimiento, Corredor, Evaluacion, Incidente, Ruta, Zona


class CrudApiTests(APITestCase):
    """Comprueba el CRUD completo y los códigos HTTP de cada entidad."""

    def test_crud_zona(self):
        r = self.client.post('/api/zonas/', {'nombre': 'Zamora Huayco'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        url = f"/api/zonas/{r.data['id']}/"
        self.assertEqual(self.client.get(url).status_code, status.HTTP_200_OK)
        r = self.client.patch(url, {'descripcion': 'Sector este'}, format='json')
        self.assertEqual(r.data['descripcion'], 'Sector este')
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)

    def test_crud_ruta_y_validacion(self):
        zona = Zona.objects.get(nombre='Jipiro')
        datos = {'zona': zona.id, 'nombre': 'Ruta de prueba', 'km': 6, 'iluminacion': 80,
                 'afluencia': 60, 'apoyo': 50}
        r = self.client.post('/api/rutas/', datos, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        url = f"/api/rutas/{r.data['id']}/"
        r = self.client.put(url, {**datos, 'km': 6.5}, format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['km'], 6.5)
        r = self.client.post('/api/rutas/', {**datos, 'nombre': 'Otra', 'iluminacion': 150}, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('iluminacion', r.data)
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_204_NO_CONTENT)

    def test_no_borra_zona_con_rutas(self):
        zona = Zona.objects.get(nombre='Jipiro')
        r = self.client.delete(f'/api/zonas/{zona.id}/')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_corredor_y_consentimiento(self):
        r = self.client.post('/api/corredores/', {'alias': 'Ana'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertFalse(r.data['consentimiento_vigente'])
        corredor = r.data['id']
        r = self.client.post('/api/consentimientos/', {'corredor': corredor}, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        repetido = self.client.post('/api/consentimientos/', {'corredor': corredor}, format='json')
        self.assertEqual(repetido.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(self.client.get(f'/api/corredores/{corredor}/').data['consentimiento_vigente'])

    def test_incidente_reglas(self):
        sin_consentimiento = Corredor.objects.create(alias='Sin permiso')
        con = Corredor.objects.get(alias='Corredor demo A')
        zona = Zona.objects.get(nombre='Jipiro')
        datos = {'autor': con.id, 'zona': zona.id, 'tipo': 'OBSTACULO',
                 'ubicacion': 'Entrada norte', 'fecha': timezone.now().isoformat()}
        r = self.client.post('/api/incidentes/', datos, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data['estado'], 'SIN_CONFIRMAR')
        url = f"/api/incidentes/{r.data['id']}/"
        r = self.client.patch(url, {'estado': 'CONFIRMADO'}, format='json')
        self.assertEqual(r.data['estado_texto'], 'Confirmado')
        r = self.client.post('/api/incidentes/', {**datos, 'autor': sin_consentimiento.id}, format='json')
        self.assertIn('autor', r.data)
        futuro = (timezone.now() + timedelta(days=1)).isoformat()
        r = self.client.post('/api/incidentes/', {**datos, 'fecha': futuro}, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_204_NO_CONTENT)


class IndiceTests(APITestCase):
    """Regla de negocio: índice de seguridad y recomendación."""

    def test_indice_mismo_valor_que_el_prototipo(self):
        ruta = Ruta.objects.get(nombre='Circuito del parque')
        # 85*.30 + 80*.20 + 84*.25 + 70*.15 + 45*.10 = 77.5 -> 78 (salida a las 06:00)
        self.assertEqual(calcular_indice(ruta, time(6, 0), recientes=0), 78)

    def test_recomendar_top3_ordenado_y_guarda_evaluaciones(self):
        zona = Zona.objects.get(nombre='Jipiro')
        r = self.client.post('/api/rutas/recomendar/', {'zona': zona.id, 'km': 5, 'hora': '06:00'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        indices = [x['indice'] for x in r.data]
        self.assertEqual(len(indices), 3)
        self.assertEqual(indices, sorted(indices, reverse=True))
        self.assertEqual(Evaluacion.objects.count(), 3)

    def test_recomendar_valida_distancia(self):
        zona = Zona.objects.get(nombre='Jipiro')
        r = self.client.post('/api/rutas/recomendar/', {'zona': zona.id, 'km': 0, 'hora': '06:00'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('km', r.data)

    def test_incidentes_bajan_el_indice_y_evaluacion_calculada(self):
        ruta = Ruta.objects.get(nombre='Circuito del parque')
        antes = calcular_indice(ruta, time(6, 0))
        autor = Corredor.objects.get(alias='Corredor demo A')
        Incidente.objects.create(autor=autor, zona=ruta.zona, tipo='VIA', ubicacion='Puente', fecha=timezone.now())
        self.assertLess(calcular_indice(ruta, time(6, 0)), antes)
        r = self.client.post('/api/evaluaciones/', {'ruta': ruta.id, 'hora_salida': '19:00', 'indice': 100}, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(r.data['indice'], 100)  # el cliente no puede fijar el índice
        self.assertTrue(Consentimiento.objects.filter(corredor=autor).exists())
