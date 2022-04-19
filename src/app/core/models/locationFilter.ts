import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';
import { Seguidor } from './seguidor';

export class LocationFilter implements FilterInterface {
  type: string;
  filasPlanta: number;
  columnasPlanta: number;

  constructor(type: string, filasPlanta: number, columnasPlanta: number) {
    this.type = type;
    this.filasPlanta = filasPlanta;
    this.columnasPlanta = columnasPlanta;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    return elems.filter((elem) => {
      if (elem.hasOwnProperty('anomaliasCliente')) {
        return (
          (elem as Seguidor).anomaliasCliente.filter(
            (anom) => anom.localY > this.filasPlanta || anom.localX > this.columnasPlanta
          ).length > 0
        );
      } else {
        return elem.localY > this.filasPlanta || elem.localX > this.columnasPlanta;
      }
    });
  }

  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
