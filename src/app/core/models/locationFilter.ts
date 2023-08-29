import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';
import { Seguidor } from './seguidor';

export class LocationFilter implements FilterInterface {
  type: string;
  filasPlanta: number;
  columnasPlanta: number;

  constructor(type: string, filasPlanta: number, columnasPlanta: number) {
    this.type = type;
    this.filasPlanta = filasPlanta;
    this.columnasPlanta = columnasPlanta;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    if (this.type === 'locationTipo0') {
      return elems.filter((elem) => elem.localY === 0 || elem.localX === 0);
    } else {
      if (elems[0] instanceof Seguidor) {
        // si hay una anomalías con fila y columna mal, mostramos tadas las del seguidor
        return elems.filter(({ anomaliasCliente }: Seguidor) =>
          anomaliasCliente.some((anom) => anom.localY > this.filasPlanta || anom.localX > this.columnasPlanta)
        );
      } else {
        return elems.filter((elem) => elem.localY > this.filasPlanta || elem.localX > this.columnasPlanta);
      }
    }
  }

  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
