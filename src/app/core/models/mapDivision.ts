import { Coordinate } from 'ol/coordinate';
import { MapElement } from './mapElement';

export class MapDivision implements MapElement {
  id?: string;
  coords: Coordinate[];
  type: string;
  numDivision?: number;
  imagesIds?: string[];
  numImages?: number;
  // mapId?: string;
}
