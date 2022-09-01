import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';
import { Seguidor } from './seguidor';

export class NoModulesFilter implements FilterInterface {
  type: string;
  index: number;

  constructor(type: string) {
    this.type = type;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    return elems.filter((elem) => {
      if (elem.hasOwnProperty('anomaliasCliente')) {
        return (elem as Seguidor).anomaliasCliente.filter((anom) => anom.modulo === null).length > 0;
      } else {
        return elem.modulo === null;
      }
    });
  }

  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
