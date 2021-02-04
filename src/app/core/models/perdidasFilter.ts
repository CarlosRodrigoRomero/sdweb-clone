import { FilterInterface } from './filter';
import { FiltrableInterface } from './filtrableInterface';

export class PerdidasFilter implements FilterInterface {
  type: string;
  rangoMin: number;
  rangoMax: number;

  constructor(type: string, rangoMin: number, rangoMax: number) {
    this.type = type;
    this.rangoMin = rangoMin;
    this.rangoMax = rangoMax;
  }

  applyFilter(pcs: FiltrableInterface[]): FiltrableInterface[] {
    return pcs.filter((pc) => pc.perdidas >= this.rangoMin / 100 && pc.perdidas <= this.rangoMax / 100);

    
  }
  unapplyFilter(pcs: FiltrableInterface[]): FiltrableInterface[] {
    return null;
  }
}