import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';

export class TipoElemFilter implements FilterInterface {
  id: string;
  type: string;
  tipo: number;
  numOfTipos: number;
  position: number;

  constructor(id: string, type: string, tipo: number, numOfTipos: number, position: number) {
    this.id = id;
    this.type = type;
    this.tipo = tipo;
    this.numOfTipos = numOfTipos;
    this.position = position;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    return elems.filter(
      (elem) =>
        // tslint:disable-next-line: triple-equals
        elem.tipo == this.tipo
    );
  }
  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
