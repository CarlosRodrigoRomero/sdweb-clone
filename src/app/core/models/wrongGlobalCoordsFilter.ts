import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';
import { Seguidor } from './seguidor';

export class WrongGlobalCoordsFilter implements FilterInterface {
  type: string;
  index: number;

  constructor(type: string, index: number) {
    this.type = type;
    this.index = index;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    return elems.filter((elem) => {
      if (elem.hasOwnProperty('anomaliasCliente')) {
        return (elem as Seguidor).anomaliasCliente.filter((anom) => anom.globalCoords[this.index] === null).length > 0;
      } else {
        return elem.globalCoords[this.index] === null;
      }
    });
  }

  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
