/** Modelos de RUNCTY: mismos campos que devuelve la API de Django. */

export interface Corredor {
  id: number;
  alias: string;
  correo: string;
  activo: boolean;
  consentimiento_vigente: boolean;
  creado: string;
}

export interface Consentimiento {
  id: number;
  corredor: number;
  corredor_alias: string;
  version: string;
  aceptado: boolean;
  fecha: string;
}

export interface Zona {
  id: number;
  nombre: string;
  descripcion: string;
  total_rutas: number;
}

export type Superficie = 'PAVIMENTO' | 'MIXTA' | 'TIERRA';
export type Dificultad = 'BAJA' | 'MEDIA' | 'ALTA';

export interface Ruta {
  id: number;
  zona: number;
  zona_nombre: string;
  nombre: string;
  km: number;
  desnivel: number;
  superficie: Superficie;
  dificultad: Dificultad;
  iluminacion: number;
  afluencia: number;
  apoyo: number;
  incidentes_base: number;
}

export interface Evaluacion {
  id: number;
  ruta: number;
  ruta_nombre: string;
  corredor: number | null;
  corredor_alias: string | null;
  hora_salida: string;
  indice: number;
  fecha: string;
}

export type TipoIncidente = 'ILUMINACION' | 'OBSTACULO' | 'VIA';
export type EstadoIncidente = 'SIN_CONFIRMAR' | 'CONFIRMADO' | 'DESCARTADO';

export interface Incidente {
  id: number;
  autor: number;
  autor_alias: string;
  zona: number;
  zona_nombre: string;
  tipo: TipoIncidente;
  tipo_texto: string;
  ubicacion: string;
  fecha: string;
  estado: EstadoIncidente;
  estado_texto: string;
  creado: string;
}

export interface Recomendacion {
  ruta: Ruta;
  indice: number;
  aportes: { factor: string; puntos: number }[];
  evaluacion: number;
}

/** Respuesta paginada de Django REST Framework. */
export interface Pagina<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Opciones de los campos con choices (mismos valores que en models.py). */
export const SUPERFICIES: Record<Superficie, string> = {
  PAVIMENTO: 'Pavimento', MIXTA: 'Mixta', TIERRA: 'Tierra',
};
export const DIFICULTADES: Record<Dificultad, string> = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta' };
export const TIPOS_INCIDENTE: Record<TipoIncidente, string> = {
  ILUMINACION: 'Iluminación deficiente', OBSTACULO: 'Obstáculo en el camino', VIA: 'Vía deteriorada',
};
export const ESTADOS_INCIDENTE: Record<EstadoIncidente, string> = {
  SIN_CONFIRMAR: 'Sin confirmar', CONFIRMADO: 'Confirmado', DESCARTADO: 'Descartado',
};
