import { LatLngLiteral } from '@agm/core/map-types';
import { ModuloInterface } from './modulo';

export interface ElementoPlantaInterface {
  archivo: string;
  vuelo: string;
  id: string;
  plantaId?: string;

  getLatLng(): LatLngLiteral;
  setLatLng(latLng: LatLngLiteral): void;
  setGlobals(globals: any[]);
  setModulo(modulo: ModuloInterface);
}
