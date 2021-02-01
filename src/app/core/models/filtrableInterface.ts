import { ModuloInterface } from './modulo';

export interface FiltrableInterface {
  tipo: number;
  globalCoords: string[];
  clase: number;
  perdidas: number;
  gradienteNormalizado: number;
  temperaturaMax: number;
  modulo: ModuloInterface;
  temperaturaRef: number;

  gps_lng?: number;
  gps_lat?: number;
  local_id?: number;
  severidad?: number;
  reparable?: boolean;
  gradiente?: number;
  local_x?: number;
  local_y?: number;
}
