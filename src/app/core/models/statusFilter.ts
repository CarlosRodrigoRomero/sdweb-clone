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
    console.log(this.status);
    console.log(elems);
    return elems.filter((elem) => {
      if (elem.hasOwnProperty('anomaliasCliente')) {
        return (elem as Seguidor).anomaliasCliente.filter((anom) => anom.status === this.status.toLowerCase()).length > 0;
      } else {
        return elem.status == this.status.toLowerCase();
      }
    });
  }
  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
