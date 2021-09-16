import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';
import { Seguidor } from './seguidor';

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
    return elems.filter((elem) => {
      if (elem.hasOwnProperty('anomaliasCliente')) {
        // tslint:disable-next-line: triple-equals
        return (elem as Seguidor).anomaliasCliente.filter((anom) => anom.tipo == this.tipo).length > 0;
      } else {
        // tslint:disable-next-line: triple-equals
        return elem.tipo == this.tipo;
      }
    });
  }
  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
