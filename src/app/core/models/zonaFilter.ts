import { FilterInterface } from './filter';
import { FiltrableInterface } from './filtrableInterface';

export class ZonaFilter implements FilterInterface {
  id: string;
  type: string;
  zona: string;

  constructor(id: string, type: string, zona: string) {
    this.id = id;
    this.type = type;
    this.zona = zona;
  }

  applyFilter(pcs: FiltrableInterface[]): FiltrableInterface[] {
    return pcs.filter((pc) => pc.global_x === this.zona);
  }
  unapplyFilter(pcs: FiltrableInterface[]): FiltrableInterface[] {
    return null;
  }
}