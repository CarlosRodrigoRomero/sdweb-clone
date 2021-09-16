import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';
import { Seguidor } from './seguidor';

export class ClaseFilter implements FilterInterface {
  id: string;
  type: string;
  clase: number;

  constructor(id: string, type: string, clase: number) {
    this.id = id;
    this.type = type;
    this.clase = clase;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    return elems.filter((elem) => {
      if (elem.hasOwnProperty('anomaliasCliente')) {
        // tslint:disable-next-line: triple-equals
        return (elem as Seguidor).anomaliasCliente.filter((anom) => anom.clase == this.clase).length > 0;
      } else {
        // tslint:disable-next-line: triple-equals
        return elem.clase == this.clase;
      }
    });
  }
  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
