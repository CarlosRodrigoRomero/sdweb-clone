import { InformeInterface } from './informe';

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
  alturaBajaPrimero?: boolean;
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
  nombreLocalX?: string;
  nombreLocalY?: string;
  stringConectorGlobals?: string;
  numerosSerie?: boolean;
  numeroSeguidores?: number;
  autoLocReady?: boolean;
  numeroGlobalCoords?: number;
}
