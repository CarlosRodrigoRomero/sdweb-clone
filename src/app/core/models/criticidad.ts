import { FilterInterface } from './filter';
import { FiltrableInterface } from './filtrableInterface';

export class CriticidadFilter implements FilterInterface {
  id: string;
  type: string;
  criticidad: number;

  constructor(id: string, type: string, criticidad: number) {
    this.id = id;
    this.type = type;
    this.criticidad = criticidad;
  }

  applyFilter(elems: FiltrableInterface[]): FiltrableInterface[] {
    // tslint:disable-next-line: triple-equals
    return elems.filter((elem) => elem.criticidad == this.criticidad); // antes pc.severidad
  }
  unapplyFilter(elems: FiltrableInterface[]): FiltrableInterface[] {
    return null;
  }
}
