import { FilterInterface } from './filter';
import { FiltrableInterface } from './filtrableInterface';

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

  applyFilter(elems: FiltrableInterface[]): FiltrableInterface[] {
    // tslint:disable-next-line: triple-equals
    return elems.filter((elem) => elem.tipo == this.tipo);
  }
  unapplyFilter(elems: FiltrableInterface[]): FiltrableInterface[] {
    return null;
  }
}
