import { FilterInterface } from './filter';
import { FilterableElement } from './filtrableInterface';
import { ModuloBruto } from './moduloBruto';

export class ConfianzaFilter implements FilterInterface {
  id?: string;
  type: string;
  multConfianza: number;

  constructor(type: string, confianza: number) {
    this.type = type;
    this.multConfianza = confianza;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    const confianzas = elems.map((elem) => (elem as ModuloBruto).confianza);
    const confianzaMedia = this.average(confianzas);
    const standardDesv = this.standardDeviation(confianzas);

    return elems.filter(
      (elem) =>
        (elem as ModuloBruto).confianza >= confianzaMedia - (1 - this.multConfianza) * standardDesv &&
        (elem as ModuloBruto).confianza <= confianzaMedia + (1 - this.multConfianza) * standardDesv
    );
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
