import { FilterInterface } from './filter';
import { FilterableElement } from './filtrableInterface';
import { ModuloBruto } from './moduloBruto';

export class ConfianzaFilter implements FilterInterface {
  id?: string;
  type: string;
  confianza: number;

  constructor(type: string, confianza: number) {
    this.type = type;
    this.confianza = confianza;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    return elems.filter((elem) => (elem as ModuloBruto).confianza < this.confianza);
  }
  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
