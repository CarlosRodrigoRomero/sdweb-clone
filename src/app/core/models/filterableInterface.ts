import { ModuloInterface } from './modulo';

export interface FilterableElement {
  id?: string;
  globalCoords?: string[];
  perdidas?: number;
  temperaturaMax?: number;
  modulo?: ModuloInterface;
  tipo?: number;
  clase?: number;
  criticidad?: number;
  gradienteNormalizado?: number;
  temperaturaRef?: number;
  gps_lng?: number;
  gps_lat?: number;
  local_id?: number;
  reparable?: boolean;
  gradiente?: number;
  global_x?: string;
  global_y?: string;
  local_x?: number;
  local_y?: number;
}
