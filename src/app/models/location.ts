import { LatLngLiteral } from "@agm/core/map-types";

export interface LocationAreaInterface {
  id?: string;
  plantaId?: string;
  path?: LatLngLiteral[];
  globalX: any;
  globalY: string;
  visible?: boolean;
}
