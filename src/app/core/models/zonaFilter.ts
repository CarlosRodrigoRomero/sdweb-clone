import { FilterInterface } from './filter';
import { FilterableElement } from './filtrableInterface';

export class ZonaFilter implements FilterInterface {
  id: string;
  type: string;
  zona: string;

  constructor(id: string, type: string, zona: string) {
    this.id = id;
    this.type = type;
    this.zona = zona;
  }

  applyFilter(pcs: FilterableElement[]): FilterableElement[] {
    return pcs.filter((pc) => pc.global_x === this.zona);
  }
  unapplyFilter(pcs: FilterableElement[]): FilterableElement[] {
    return null;
  }
}