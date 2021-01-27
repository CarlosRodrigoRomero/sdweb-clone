import { FilterInterface } from './filter';
import { PcInterface } from './pc';

export class GradientFilter implements FilterInterface {
  type: string;
  rangoMin: number;
  rangoMax: number;

  constructor(type: string, rangoMin: number, rangoMax: number) {
    this.type = type;
    this.rangoMin = rangoMin;
    this.rangoMax = rangoMax;
  }

  applyFilter(pcs: PcInterface[]): PcInterface[] {
    return pcs.filter((pc) => pc.gradienteNormalizado >= this.rangoMin && pc.gradienteNormalizado <= this.rangoMax);
  }
  unapplyFilter(pcs: PcInterface[]): PcInterface[] {
    return null;
  }
}
