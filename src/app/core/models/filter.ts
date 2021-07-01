import { FilterableElement } from './filterableInterface';

export interface FilterInterface {
  id?: string;
  type?: string;

  applyFilter(elems: FilterableElement[]): FilterableElement[];
  unapplyFilter(elems: FilterableElement[]): FilterableElement[];
}
