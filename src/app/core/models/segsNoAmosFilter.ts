import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';
import { Seguidor } from './seguidor';

export class SegsNoAnomsFilter implements FilterInterface {
  id: string;
  type: string;

  constructor(id: string, type: string) {
    this.id = id;
    this.type = type;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    return (elems as Seguidor[]).filter((seg) => seg.anomaliasCliente.length > 0);
  }

  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
