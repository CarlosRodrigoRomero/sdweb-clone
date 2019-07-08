import { LatLngLiteral } from "@agm/core/map-types";

export interface LocationAreaInterface {
  id?: string;
  plantaId?: string;
  path?: LatLngLiteral[];
  globalX: any;
  globalY: string;
  potenciaModulo: number;
  nombreModulo: string;
  visible?: boolean;
}
