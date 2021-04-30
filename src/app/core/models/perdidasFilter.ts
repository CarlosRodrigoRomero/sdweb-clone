import { FilterInterface } from './filter';
import { FilterableElement } from './filtrableInterface';

export class PerdidasFilter implements FilterInterface {
  type: string;
  rangoMin: number;
  rangoMax: number;

  constructor(type: string, rangoMin: number, rangoMax: number) {
    this.type = type;
    this.rangoMin = rangoMin;
    this.rangoMax = rangoMax;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    return elems.filter((elem) => elem.perdidas >= this.rangoMin / 100 && elem.perdidas <= this.rangoMax / 100);
  }

  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
