import { FilterInterface } from './filter';
import { PcInterface } from './pc';

export class TipoPcFilter implements FilterInterface {
  id: string;
  type: string;
  tipo: number;

  constructor(id: string, type: string, tipo: number) {
    this.id = id;
    this.type = type;
    this.tipo = tipo;
  }

  applyFilter(pcs: PcInterface[]): PcInterface[] {
    return pcs.filter((pc) => pc.tipo === this.tipo);
  }
  unapplyFilter(pcs: PcInterface[]): PcInterface[] {
    return null;
  }
}