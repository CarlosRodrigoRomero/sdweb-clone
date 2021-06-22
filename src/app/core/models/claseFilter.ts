import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';

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
    // tslint:disable-next-line: triple-equals
    return elems.filter((elem) => elem.clase == this.clase);
  }
  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
