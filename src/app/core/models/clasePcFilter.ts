import { FilterInterface } from './filter';
import { PcInterface } from './pc';

export class ClasePcFilter implements FilterInterface {
  id: string;
  type: string;
  clase: number;

  constructor(id: string, type: string, clase: number) {
    this.id = id;
    this.type = type;
    this.clase = clase;
  }

  applyFilter(pcs: PcInterface[]): PcInterface[] {
    return pcs.filter((pc) => pc.severidad === this.clase);
  }
  unapplyFilter(pcs: PcInterface[]): PcInterface[] {
    return null;
  }
}
