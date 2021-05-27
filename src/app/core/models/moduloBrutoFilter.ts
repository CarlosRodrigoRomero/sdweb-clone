import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';
import { RawModule } from './moduloBruto';

export class ModuloBrutoFilter implements FilterInterface {
  id?: string;
  type: string;
  multiplier: number;

  constructor(type: string, multiplier: number) {
    this.type = type;
    this.multiplier = multiplier;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    const correctType = this.type.replace('M', '');

    const params = elems
      .filter((elem) => (elem as RawModule)[correctType] !== undefined)
      .map((elem) => (elem as RawModule)[correctType]);
    const paramsMedio = this.average(params);
    const standardDesv = this.standardDeviation(params);

    return elems.filter((elem) => {
      return (
        (elem as RawModule)[correctType] === undefined ||
        ((elem as RawModule)[correctType] >= paramsMedio - (1 - this.multiplier) * standardDesv &&
          (elem as RawModule)[correctType] <= paramsMedio + (1 - this.multiplier) * standardDesv)
      );
    });
  }

  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }

  private standardDeviation(values) {
    const avg = this.average(values);

    const squareDiffs = values.map((value) => {
      const diff = value - avg;
      const sqrDiff = diff * diff;

      return sqrDiff;
    });

    const avgSquareDiff = this.average(squareDiffs);

    const stdDev = Math.sqrt(avgSquareDiff);

    return stdDev;
  }

  private average(values) {
    const sum = values.reduce((s, value) => s + value, 0);

    const avg = sum / values.length;

    return avg;
  }
}
