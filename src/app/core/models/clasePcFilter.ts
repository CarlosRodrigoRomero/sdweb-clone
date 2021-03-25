import { FilterInterface } from './filter';
import { FiltrableInterface } from './filtrableInterface';

export class SeveridadFilter implements FilterInterface {
  id: string;
  type: string;
  clase: number;

  constructor(id: string, type: string, severidad: number) {
    this.id = id;
    this.type = type;
    this.clase = severidad;
  }

  applyFilter(elems: FiltrableInterface[]): FiltrableInterface[] {
    // tslint:disable-next-line: triple-equals
    return elems.filter((elem) => elem.clase == this.clase); // antes pc.severidad
  }
  unapplyFilter(elems: FiltrableInterface[]): FiltrableInterface[] {
    return null;
  }
}
