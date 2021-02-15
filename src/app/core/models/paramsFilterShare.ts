import { Coordinate } from 'ol/coordinate';

export interface ParamsFilterShare {
  minGradient?: number;
  maxGradient?: number;
  minPerdidas?: number;
  maxPerdidas?: number;
  minTempMax?: number;
  maxTempMax?: number;
  coordsArea?: Coordinate[][];
  clase?: number;
  modulo?: string;
  tipo?: number;
  zona?: string;
}
