import { Observable } from "rxjs";
export interface PcInterface {
  id?: string;
  archivo?: string;
  archivoPublico?: string;
  tipo?: number;
  local_x?: number;
  local_y?: number;
  global_x?: number;
  global_y?: string;
  gps_lng?: number;
  gps_lat?: number;
  temperaturaMax?: number;
  temperaturaMedia?: number;
  temperaturaRef?: number;
  img_left?: number;
  img_top?: number;
  img_width?: number;
  img_height?: number;
  img_x?: number;
  img_y?: number;
  local_id?: number;
  vuelo?: string;
  image_rotation?: number;
  informeId?: string;
  datetime?: number;
  severidad?: number;
  reparable?: boolean;
  color?: string;
  downloadUrl$?: Observable<string | null>;
  downloadUrlString?: string | null;
  downloadUrlRjpg$?: Observable<string | null>;
  downloadUrlStringRjpg?: string | null;
  downloadUrlVisual$?: Observable<string | null>;
  downloadUrlStringVisual?: string | null;
  resuelto: boolean;
  irradiancia?: number;
  gradiente?: number;
  gradienteNormalizado?: number;
  polygonCoords?: Array<Array<number>>;
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
}
