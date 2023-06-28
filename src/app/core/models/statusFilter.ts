import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';
import { Seguidor } from './seguidor';

export class StatusFilter implements FilterInterface {
  id: string;
  type: string;
  status: string;
  statusNumber: number;

  constructor(id: string, type: string, status: string, statusNumber: number) {
    this.id = id;
    this.type = type;
    this.status = status;
    this.statusNumber = statusNumber;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    return elems.filter((elem) => {
      if (elem.hasOwnProperty('anomaliasCliente')) {
        // tslint:disable-next-line: triple-equals
        return (elem as Seguidor).anomaliasCliente.filter((anom) => anom.status == this.status).length > 0;
      } else {
        // tslint:disable-next-line: triple-equals
        return elem.status == this.status;
      }
    });
  }
  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
