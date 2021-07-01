import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';
import { RawModule } from './moduloBruto';

export class ModuloBrutoFilter implements FilterInterface {
  id?: string;
  type: string;
  min: number;
  max: number;

  constructor(type: string, min: number, max: number) {
    this.type = type;
    this.min = min;
    this.max = max;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    const correctType = this.type.replace('M', '');

    return elems.filter((elem) => {
      return (
        (elem as RawModule)[correctType] === undefined ||
        ((elem as RawModule)[correctType] >= this.min && (elem as RawModule)[correctType] <= this.max)
      );
    });
  }

  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
