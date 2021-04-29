import { Coordinate } from 'ol/coordinate';

export interface ModuloBruto {
  id?: string;
  confianza: number;
  aspectRatio: number;
  area: number;
  coords: Coordinate[];
}
