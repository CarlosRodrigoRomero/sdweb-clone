import { Coordinate } from 'ol/coordinate';

export interface MapElement {
  id?: string;
  coords: Coordinate[];
  type: string;
}
