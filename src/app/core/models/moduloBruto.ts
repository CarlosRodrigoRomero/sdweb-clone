import { Coordinate } from 'ol/coordinate';
import { FilterableElement } from './filterableInterface';

export class RawModule implements FilterableElement {
  id?: string;
  confianza?: number;
  aspectRatio?: number;
  area?: number;
  coords: Coordinate[];
}
