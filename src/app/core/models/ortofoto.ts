import { LatLngBoundsLiteral } from '@agm/core';

export interface OrtofotoInterface {
  id?: string;
  url?: string;
  bounds?: LatLngBoundsLiteral;
  mapMinZoom?: number;
  mapMaxZoom?: number;
}
