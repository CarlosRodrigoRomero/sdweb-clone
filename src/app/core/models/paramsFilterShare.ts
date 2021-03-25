import { Coordinate } from 'ol/coordinate';

export interface ParamsFilterShare {
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
  modulo?: string;
  tipo?: number[];
  zona?: string;
}
