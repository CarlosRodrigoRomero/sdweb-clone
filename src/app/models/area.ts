import { LatLngLiteral } from "@agm/core/map-types";

export interface AreaInterface {
  id?: string;
  plantaId?: string;
  path?: LatLngLiteral[];
  visible?: boolean;
}
