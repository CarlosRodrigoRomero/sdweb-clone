import { FilterInterface } from './filter';
import { PcInterface } from './pc';

export class TempMaxFilter implements FilterInterface {
  type: string;
  rangoMin: number;
  rangoMax: number;

  constructor(type: string, rangoMin: number, rangoMax: number) {
    this.type = type;
    this.rangoMin = rangoMin;
    this.rangoMax = rangoMax;
  }

  applyFilter(pcs: PcInterface[]): PcInterface[] {
    return pcs.filter((pc) => pc.temperaturaMax >= this.rangoMin && pc.temperaturaMax <= this.rangoMax);
  }
  unapplyFilter(pcs: PcInterface[]): PcInterface[] {
    return null;
  }
}
