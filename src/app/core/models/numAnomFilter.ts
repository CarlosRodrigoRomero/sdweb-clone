import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';
import { Seguidor } from './seguidor';

export class NumAnomFilter implements FilterInterface {
  id: string;
  type: string;
  numAnom: number;

  constructor(id: string, type: string, numAnom: number) {
    this.id = id;
    this.type = type;
    this.numAnom = numAnom;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    return elems.filter((elem) => {
      if (elem.hasOwnProperty('anomaliasCliente')) {
        // tslint:disable-next-line: triple-equals
        return (elem as Seguidor).anomaliasCliente.filter((anom) => anom.numAnom == this.numAnom).length > 0;
      } else {
        return elem.numAnom === this.numAnom;
      }
    });
  }
  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
