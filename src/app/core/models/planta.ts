import { InformeInterface } from './informe';
import { OrtofotoInterface } from './ortofoto';

export interface PlantaInterface {
  id?: string;
  nombre?: string;
  contacto?: string;
  telefono?: number;
  longitud?: number;
  latitud?: number;
  tipo?: string;
  potencia?: number;
  empresa?: string;
  notas?: string;
  filas?: number;
  columnas?: number;
  vertical?: boolean;
  num_modulos?: number;
  temp_limite?: number;
  zoom?: number;
  zoomCambioVista?: number;
  alturaBajaPrimero?: boolean;
  columnaDchaPrimero?: boolean;
  posicionModulo?: boolean;
  moduloPotencia?: number;
  informes?: InformeInterface[];
  modulos?: string[];
  etiquetasLocalX?: string[];
  etiquetasLocalY?: string[];
  etiquetasLocalXY?: string[];
  referenciaSolardrone?: boolean;
  criterioId?: string;
  nombreGlobalX?: string;
  nombreGlobalY?: string;
  nombreGlobalZ?: string;
  nombreGlobalCoords?: string[]; // 0:Instalacion 1:Pasillo o Calle 2:Mesa
  nombreLocalX?: string;
  nombreLocalY?: string;
  stringConectorGlobals?: string;
  numerosSerie?: boolean;
  numeroSeguidores?: number;
  autoLocReady?: boolean;
  numeroGlobalCoords?: number;
  ortofoto?: OrtofotoInterface;
  sizeZonesClusters?: number;
}
