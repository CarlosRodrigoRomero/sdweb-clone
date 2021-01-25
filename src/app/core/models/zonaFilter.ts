import { FilterInterface } from './filter';
import { PcInterface } from './pc';

export class ZonaFilter implements FilterInterface {
  id: string;
  type: string;
  zona: string;

  constructor(id: string, type: string, zona: string) {
    this.id = id;
    this.type = type;
    this.zona = zona;
  }

  applyFilter(pcs: PcInterface[]): PcInterface[] {
    return pcs.filter((pc) => pc.global_x === this.zona);
  }
  unapplyFilter(pcs: PcInterface[]): PcInterface[] {
    return null;
  }
}