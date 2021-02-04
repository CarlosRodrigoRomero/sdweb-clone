import { FilterInterface } from './filter';
import { FiltrableInterface } from './filtrableInterface';

export class TipoPcFilter implements FilterInterface {
  id: string;
  type: string;
  tipo: number;

  constructor(id: string, type: string, tipo: number) {
    this.id = id;
    this.type = type;
    this.tipo = tipo;
  }

  applyFilter(pcs: FiltrableInterface[]): FiltrableInterface[] {
    return pcs.filter((pc) => pc.tipo === this.tipo);
  }
  unapplyFilter(pcs: FiltrableInterface[]): FiltrableInterface[] {
    return null;
  }
}