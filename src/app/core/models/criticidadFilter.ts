import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';
import { Seguidor } from './seguidor';

export class CriticidadFilter implements FilterInterface {
  id: string;
  type: string;
  criticidad: number;

  constructor(id: string, type: string, criticidad: number) {
    this.id = id;
    this.type = type;
    this.criticidad = criticidad;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    return elems.filter((elem) => {
      if (elem.hasOwnProperty('anomaliasCliente')) {
        // tslint:disable-next-line: triple-equals
        return (elem as Seguidor).anomaliasCliente.filter((anom) => anom.criticidad == this.criticidad).length > 0;
      } else {
        // tslint:disable-next-line: triple-equals
        return elem.criticidad == this.criticidad;
      }
    });
  }
  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
