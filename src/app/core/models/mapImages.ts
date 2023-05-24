import { Coordinate } from 'ol/coordinate';

export interface MapImage {
  id?: string;
  coords: Coordinate;
  archivo: string;
}
