import { FilterInterface } from './filter';
import { FilterableElement } from './filtrableInterface';

export class TempMaxFilter implements FilterInterface {
  type: string;
  rangoMin: number;
  rangoMax: number;

  constructor(type: string, rangoMin: number, rangoMax: number) {
    this.type = type;
    this.rangoMin = rangoMin;
    this.rangoMax = rangoMax;
  }

  applyFilter(pcs: FilterableElement[]): FilterableElement[] {
    return pcs.filter((pc) => pc.temperaturaMax >= this.rangoMin && pc.temperaturaMax <= this.rangoMax);
  }
  unapplyFilter(pcs: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
