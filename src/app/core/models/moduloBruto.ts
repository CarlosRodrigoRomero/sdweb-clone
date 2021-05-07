import { Coordinate } from 'ol/coordinate';
import { FilterableElement } from './filtrableInterface';

export class RawModule implements FilterableElement {
  id?: string;
  confianza?: number;
  aspectRatio?: number;
  area?: number;
  coords: Coordinate[];
}
