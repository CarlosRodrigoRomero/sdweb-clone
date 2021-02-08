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

  applyFilter(pcs: FiltrableInterface[]): FiltrableInterface[] {
    return pcs.filter((pc) => pc.clase == this.clase); // antes pc.severidad
  }
  unapplyFilter(pcs: FiltrableInterface[]): FiltrableInterface[] {
    return null;
  }
}
