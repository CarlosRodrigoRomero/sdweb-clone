import { Observable } from 'rxjs';
import { ModuloInterface } from './modulo';
import { ElementoPlantaInterface } from '@core/models/elementoPlanta';
import { LatLngLiteral } from '@agm/core';

export interface PcInterface {
  id?: string;
  archivo?: string;
  archivoPublico?: string;
  tipo?: number;
  local_x?: number;
  local_y?: number;
  global_x?: any;
  global_y?: any;
  global_z?: any;
  gps_lng?: number;
  gps_lat?: number;
  temperaturaMax?: number;
  temperaturaMedia?: number;
  temperaturaRef?: number;
  img_left?: number;
  img_top?: number;
  img_width?: number;
  img_height?: number;
  coords?: any[];
  img_x?: number;
  img_y?: number;
  local_id?: number;
  vuelo?: string;
  image_rotation?: number;
  informeId?: string;
  datetime?: number;
  severidad?: number;
  reparable?: boolean;
  downloadUrl$?: Observable<string | null>;
  downloadUrlString?: string | null;
  downloadUrlRjpg$?: Observable<string | null>;
  downloadUrlStringRjpg?: string | null;
  downloadUrlVisual$?: Observable<string | null>;
  downloadUrlStringVisual?: string | null;
  resuelto?: boolean;
  irradiancia?: number;
  gradiente?: number;
  gradienteNormalizado?: number;
  polygonCoords?: Array<Array<number>>;
  refTop?: number;
  refLeft?: number;
  refHeight?: number;
  refWidth?: number;
  coordsRef?: any[];
  camaraNombre?: string;
  camaraLente?: string;
  camaraSN?: number;
  emisividad?: number;
  temperaturaReflejada?: number;
  humedadRelativa?: number;
  viento?: string;
  temperaturaAire?: number;
  distancia?: number;
  perdidas?: number;
  datetimeString?: string;
  rangeMax?: number;
  rangeMin?: number;
  nubosidad?: string;
  modulosAfectados?: number;
  modulo?: ModuloInterface;
  clase?: number;
  numeroSerie?: string;
  globalCoords?: any[];
  TlinearGain?: number;
}

export class Pc implements PcInterface, ElementoPlantaInterface {
  id: string;
  archivo: string;
  archivoPublico?: string;
  tipo?: number;
  local_x?: number;
  local_y?: number;
  global_x?: any;
  global_y?: any;
  global_z?: any;
  gps_lng?: number;
  gps_lat?: number;
  temperaturaMax?: number;
  temperaturaMedia?: number;
  temperaturaRef?: number;
  coords?: number[][];
  img_left?: number;
  img_top?: number;
  img_width?: number;
  img_height?: number;
  img_x?: number;
  img_y?: number;
  local_id?: number;
  vuelo: string;
  image_rotation?: number;
  informeId?: string;
  datetime?: number;
  severidad?: number;
  reparable?: boolean;
  downloadUrl$?: Observable<string | null>;
  downloadUrlString?: string | null;
  downloadUrlRjpg$?: Observable<string | null>;
  downloadUrlStringRjpg?: string | null;
  downloadUrlVisual$?: Observable<string | null>;
  downloadUrlStringVisual?: string | null;
  resuelto?: boolean;
  irradiancia?: number;
  gradiente?: number;
  gradienteNormalizado?: number;
  polygonCoords?: Array<Array<number>>;
  coordsRef?: number[][];
  refTop?: number;
  refLeft?: number;
  refHeight?: number;
  refWidth?: number;
  camaraNombre?: string;
  camaraLente?: string;
  camaraSN?: number;
  emisividad?: number;
  temperaturaReflejada?: number;
  humedadRelativa?: number;
  viento?: string;
  temperaturaAire?: number;
  distancia?: number;
  perdidas?: number;
  datetimeString?: string;
  rangeMax?: number;
  rangeMin?: number;
  nubosidad?: string;
  modulosAfectados?: number;
  modulo: ModuloInterface;
  clase?: number;
  numeroSerie?: string;
  globalCoords?: any[];
  TlinearGain?: number;

  constructor(pc: PcInterface) {
    Object.assign(this, pc);
  }

  getLatLng(): LatLngLiteral {
    return { lat: this.gps_lat, lng: this.gps_lng };
  }
  setLatLng(latLng: LatLngLiteral): void {
    this.gps_lat = latLng.lat;
    this.gps_lng = latLng.lng;
  }
  setGlobals(globals: any[]) {
    globals.forEach((v, i, array) => {
      this.globalCoords[i] = v;
    });
  }
  setModulo(modulo: ModuloInterface) {
    this.modulo = modulo;
  }
}
