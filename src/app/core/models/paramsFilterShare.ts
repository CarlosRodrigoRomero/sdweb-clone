import { Coordinate } from 'ol/coordinate';

export interface ParamsFilterShare {
  id?: string;
  informeId?: string;
  plantaId?: string;
  minGradient?: number;
  maxGradient?: number;
  minPerdidas?: number;
  maxPerdidas?: number;
  minTempMax?: number;
  maxTempMax?: number;
  area?: number[];
  clase?: boolean[];
  criticidad?: boolean[];
  reparable?: boolean[];
  modulo?: string;
  modelo?: string[];
  tipo?: number[];
  zonas?: string[];
  zona?: string;
  segsNoAnoms?: boolean;
  fechaCreacion?: number;
  ultimoAcceso?: number;
  numAccesos?: number;
}
