import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { CrudApi } from './crud-api';
import {
  AlertaZona, Calificacion, Club, Consentimiento, ContactoConfianza, Corredor, Evaluacion, Incidente,
  Recomendacion, Ruta, Zona,
} from './modelos';

/** Un servicio por entidad (todos con CRUD completo). */
@Injectable({ providedIn: 'root' })
export class CorredoresApi extends CrudApi<Corredor> {
  constructor() { super(inject(HttpClient), 'corredores'); }
}

@Injectable({ providedIn: 'root' })
export class ConsentimientosApi extends CrudApi<Consentimiento> {
  constructor() { super(inject(HttpClient), 'consentimientos'); }
}

@Injectable({ providedIn: 'root' })
export class ContactosApi extends CrudApi<ContactoConfianza> {
  constructor() { super(inject(HttpClient), 'contactos'); }
}

@Injectable({ providedIn: 'root' })
export class ClubesApi extends CrudApi<Club> {
  constructor() { super(inject(HttpClient), 'clubes'); }
}

@Injectable({ providedIn: 'root' })
export class ZonasApi extends CrudApi<Zona> {
  constructor() { super(inject(HttpClient), 'zonas'); }

  /** GET /api/zonas/{id}/alerta/ → RF-09. */
  alerta(id: number): Observable<AlertaZona> {
    return this.http.get<AlertaZona>(`${this.url}${id}/alerta/`);
  }
}

@Injectable({ providedIn: 'root' })
export class CalificacionesApi extends CrudApi<Calificacion> {
  constructor() { super(inject(HttpClient), 'calificaciones'); }
}

@Injectable({ providedIn: 'root' })
export class RutasApi extends CrudApi<Ruta> {
  constructor() { super(inject(HttpClient), 'rutas'); }

  /** POST /api/rutas/recomendar/ → las 3 rutas más seguras para la zona, distancia y hora. */
  recomendar(datos: { zona: number; km: number; hora: string; corredor?: number | null }):
    Observable<Recomendacion[]> {
    const cuerpo = { ...datos } as Record<string, unknown>;
    if (!cuerpo['corredor']) delete cuerpo['corredor'];
    return this.http.post<Recomendacion[]>(`${this.url}recomendar/`, cuerpo);
  }
}

@Injectable({ providedIn: 'root' })
export class EvaluacionesApi extends CrudApi<Evaluacion> {
  constructor() { super(inject(HttpClient), 'evaluaciones'); }
}

@Injectable({ providedIn: 'root' })
export class IncidentesApi extends CrudApi<Incidente> {
  constructor() { super(inject(HttpClient), 'incidentes'); }
}
