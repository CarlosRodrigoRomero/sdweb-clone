import { FilterInterface } from './filter';
import { PcInterface } from './pc';

export class TipoPcFilter implements FilterInterface {
  type: string;
  tipo: number;

  constructor(type: string, tipo: number) {
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