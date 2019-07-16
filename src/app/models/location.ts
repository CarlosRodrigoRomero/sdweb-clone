import { LatLngLiteral } from "@agm/core/map-types";
import { ModuloInterface } from './modulo';

export interface LocationAreaInterface {
  id?: string;
  plantaId?: string;
  path?: LatLngLiteral[];
  globalX: any;
  globalY: string;
  visible?: boolean;
  moduloId?: string;
  modulo?: ModuloInterface;
}
