import { FilterableElement } from './filtrableInterface';

export interface FilterInterface {
  id?: string;
  type?: string;

  applyFilter(elems: FilterableElement[]): FilterableElement[];
  unapplyFilter(elems: FilterableElement[]): FilterableElement[];
}
