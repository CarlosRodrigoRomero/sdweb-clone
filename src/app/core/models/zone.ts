import { FilterableElement } from './filterableInterface';
import { LocationAreaInterface } from './location';

export interface ZoneInterface extends LocationAreaInterface, FilterableElement {
  id?: string;
  informeId: string;
  elems: FilterableElement[];
//   filteredElements: FilterableElement[];
  globalCoords: string[];
}
