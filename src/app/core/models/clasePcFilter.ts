import { FilterInterface } from './filter';
import { FiltrableInterface } from './filtrableInterface';

export class ClasePcFilter implements FilterInterface {
  id: string;
  type: string;
  clase: number;

  constructor(id: string, type: string, clase: number) {
    this.id = id;
    this.type = type;
    this.clase = clase;
  }

  applyFilter(elems: FiltrableInterface[]): FiltrableInterface[] {
    return elems.filter((elem) => elem.clase == this.clase); // antes pc.severidad
  }
  unapplyFilter(elems: FiltrableInterface[]): FiltrableInterface[] {
    return null;
  }
}
