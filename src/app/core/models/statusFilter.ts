import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';
import { Seguidor } from './seguidor';

import { GLOBAL } from '@data/constants/global';

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
        return (elem as Seguidor).anomaliasCliente.filter((anom) => anom.status === GLOBAL.tipos_status[GLOBAL.labels_status.indexOf(this.status)]).length > 0;
      } else {
        return elem.status == GLOBAL.tipos_status[GLOBAL.labels_status.indexOf(this.status)];
      }
    });
  }
  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
