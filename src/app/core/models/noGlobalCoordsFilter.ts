import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';
import { Seguidor } from './seguidor';

export class NoGlobalCoordsFilter implements FilterInterface {
  type: string;
  index: number;

  constructor(type: string) {
    this.type = type;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    return elems.filter((elem) => {
      if (elem.hasOwnProperty('anomaliasCliente')) {
        return (
          (elem as Seguidor).anomaliasCliente.filter(
            (anom) => anom.globalCoords === null || anom.globalCoords === undefined || anom.globalCoords[0] === null
          ).length > 0
        );
      } else {
        return elem.globalCoords === null || elem.globalCoords === undefined || elem.globalCoords[0] === null;
      }
    });
  }

  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
