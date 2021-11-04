import { Coordinate } from 'ol/coordinate';
import { FilterableElement } from './filterableInterface';

export class RawModule implements FilterableElement {
  id?: string;
  confianza?: number;
  aspectRatio?: number;
  area?: number;
  coords: Coordinate[];
  centroid_gps_long: number;
  centroid_gps_lat: number;
  image_name?: string;
}
