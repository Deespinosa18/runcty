import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { urlApi } from './api.config';
import { Pagina } from './modelos';

/**
 * CRUD genérico contra un ViewSet de Django REST:
 * GET /recurso/  ·  GET /recurso/{id}/  ·  POST  ·  PATCH  ·  DELETE.
 */
export class CrudApi<T extends { id: number }> {
  protected readonly url: string;

  constructor(protected readonly http: HttpClient, recurso: string) {
    this.url = `${urlApi()}/${recurso}/`;
  }

  listar(filtros: Record<string, string | number> = {}): Observable<T[]> {
    const params = new HttpParams({ fromObject: { page_size: 200, ...filtros } });
    return this.http.get<Pagina<T>>(this.url, { params }).pipe(map((p) => p.results));
  }

  obtener(id: number): Observable<T> {
    return this.http.get<T>(`${this.url}${id}/`);
  }

  crear(datos: Partial<T>): Observable<T> {
    return this.http.post<T>(this.url, datos);
  }

  actualizar(id: number, cambios: Partial<T>): Observable<T> {
    return this.http.patch<T>(`${this.url}${id}/`, cambios);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}${id}/`);
  }
}

/** Convierte un error HTTP de Django REST en un mensaje legible. */
export function mensajeError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Sin conexión con el backend. ¿Está en ejecución "python manage.py runserver 0.0.0.0:8000"?';
    }
    if (error.status === 404) {
      return 'El registro no existe (404).';
    }
    if (error.error && typeof error.error === 'object') {
      // {"campo": ["mensaje"]}, {"non_field_errors": [...]} o {"detail": "..."}
      return Object.entries(error.error as Record<string, unknown>)
        .map(([campo, msg]) => {
          const texto = Array.isArray(msg) ? msg.join(' ') : String(msg);
          return campo === 'detail' || campo === 'non_field_errors' ? texto : `${campo}: ${texto}`;
        })
        .join('\n');
    }
    return `Error ${error.status} del servidor.`;
  }
  return 'Error inesperado.';
}
