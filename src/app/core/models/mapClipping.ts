import { Coordinate } from 'ol/coordinate';
import { MapElement } from './mapElement';

export class MapClipping implements MapElement {
  id?: string;
  coords: Coordinate[];
  type: string;
  numDivision?: number;
  // mapId?: string;
}
