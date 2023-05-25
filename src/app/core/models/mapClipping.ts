import { Coordinate } from 'ol/coordinate';

export interface MapClipping {
  id?: string;
  numDivision?: number;
  coords: Coordinate[];
  // mapId?: string;
}
