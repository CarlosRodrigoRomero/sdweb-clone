import { LatLngLiteral } from '@agm/core/map-types';

export interface ElementoPlantaInterface {
  archivo: string;
  vuelo: string;
  id: string;

  getLatLng(): LatLngLiteral;
  setLatLng(latLng: LatLngLiteral): void;
}
