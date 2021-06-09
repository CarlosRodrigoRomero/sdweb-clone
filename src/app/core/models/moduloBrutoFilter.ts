import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';
import { RawModule } from './moduloBruto';

export class ModuloBrutoFilter implements FilterInterface {
  id?: string;
  type: string;
  multiplier: number;
  average: number;
  standardDesv: number;

  constructor(type: string, multiplier: number, average: number, standardDesv: number) {
    this.type = type;
    this.multiplier = multiplier;
    this.average = average;
    this.standardDesv = standardDesv;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    const correctType = this.type.replace('M', '');

    return elems.filter((elem) => {
      return (
        (elem as RawModule)[correctType] === undefined ||
        ((elem as RawModule)[correctType] >= this.average - this.multiplier * this.standardDesv &&
          (elem as RawModule)[correctType] <= this.average + this.multiplier * this.standardDesv)
      );
    });
  }

  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
