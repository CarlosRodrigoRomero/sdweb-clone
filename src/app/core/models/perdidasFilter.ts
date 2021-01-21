import { FilterInterface } from './filter';
import { PcInterface } from './pc';

export class PerdidasFilter implements FilterInterface {
  type: string;
  rangoMin: number;
  rangoMax: number;

  constructor(type: string, rangoMin: number, rangoMax: number) {
    this.type = type;
    this.rangoMin = rangoMin;
    this.rangoMax = rangoMax;
  }

  applyFilter(pcs: PcInterface[]): PcInterface[] {
    return pcs.filter((pc) => pc.perdidas >= this.rangoMin / 100 && pc.perdidas <= this.rangoMax / 100);
  }
  unapplyFilter(pcs: PcInterface[]): PcInterface[] {
    return null;
  }
}