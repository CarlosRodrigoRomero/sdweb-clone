import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';

export class CriticidadFilter implements FilterInterface {
  id: string;
  type: string;
  criticidad: number;

  constructor(id: string, type: string, criticidad: number) {
    this.id = id;
    this.type = type;
    this.criticidad = criticidad;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    // tslint:disable-next-line: triple-equals
    return elems.filter((elem) => elem.criticidad == this.criticidad); // antes pc.severidad
  }
  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
