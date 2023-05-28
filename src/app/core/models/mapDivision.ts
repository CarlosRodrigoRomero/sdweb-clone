import { Coordinate } from 'ol/coordinate';
import { MapElement } from './mapElement';

export class MapDivision implements MapElement {
  id?: string;
  coords: Coordinate[];
  type: string;
  imagesIds?: string[];
  numImages?: number;
  // mapId?: string;
}
