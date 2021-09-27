import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';
import { Seguidor } from './seguidor';

export class SegsNoAnomsFilter implements FilterInterface {
  id: string;
  type: string;
  value: boolean;

  constructor(id: string, type: string, value: boolean) {
    this.id = id;
    this.type = type;
    this.value = value;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    if (this.value) {
      return (elems as Seguidor[]).filter((seg) => seg.anomaliasCliente.length > 0);
    } else {
      return elems;
    }
  }

  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
