import { FilterInterface } from './filter';
import { FilterableElement } from './filtrableInterface';

export class SeveridadFilter implements FilterInterface {
  id: string;
  type: string;
  clase: number;

  constructor(id: string, type: string, severidad: number) {
    this.id = id;
    this.type = type;
    this.clase = severidad;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    // tslint:disable-next-line: triple-equals
    return elems.filter((elem) => elem.severidad == this.clase); 
  }
  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
