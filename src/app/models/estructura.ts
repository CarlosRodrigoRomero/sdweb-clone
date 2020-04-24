export interface EstructuraInterface {
  id?: string;
  archivo?: string;
  coords?: any[];
  filas?: number;
  columnas?: number;
  sentido?: boolean; // false: izq->drcha | true: drcha -> izq
  columnaInicio?: number;
  filaInicio?: number;
  vuelo?: string;
  latitud?: number;
  longitud?: number;
  globalCoords?: any[];
}
