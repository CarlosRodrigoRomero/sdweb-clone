import { Coordinate } from 'ol/coordinate';

export interface MapImage {
  id?: string;
  coords: Coordinate;
  path: string;
  fecha: number;
  tipo: string;
  etiqueta_vuelo?: string;
  altitud?: number;
}
