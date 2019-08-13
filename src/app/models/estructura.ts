export interface Estructura {
  id?: string;
  informeId?: string;
  filename?: string;
  coords?: any[];
  filas?: number;
  columnas?: number;
  sentido?: boolean; // false: izq->drcha | true: drcha -> izq
  columnaInicio: number;
}
