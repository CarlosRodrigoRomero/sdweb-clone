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

  applyFilter(elems: FiltrableInterface[]): FiltrableInterface[] {
    return elems.filter((elem) => elem.perdidas >= this.rangoMin / 100 && elem.perdidas <= this.rangoMax / 100);
  }

  unapplyFilter(elems: FiltrableInterface[]): FiltrableInterface[] {
    return null;
  }
}
