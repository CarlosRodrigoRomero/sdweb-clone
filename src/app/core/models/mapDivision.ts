import { Coordinate } from 'ol/coordinate';
import { MapElement } from './mapElement';

export class MapDivision implements MapElement {
  id?: string;
  coords: Coordinate[];
  type: string;
  imagesRgbIds?: string[];
  imagesThermalIds?: string[];
  numImagesRgb?: number;
  numImagesThermal?: number;
  // mapId?: string;
}
