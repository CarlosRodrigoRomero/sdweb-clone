import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';
import { Seguidor } from './seguidor';

import { GLOBAL } from '../../data/constants/global';

export class ReparableFilter implements FilterInterface {
  id: string;
  type: string;
  reparable: boolean;

  constructor(id: string, type: string, reparable: boolean) {
    this.id = id;
    this.type = type;
    this.reparable = reparable;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    return elems.filter((elem) => {
      if (elem.hasOwnProperty('anomaliasCliente')) {
        if (this.reparable) {
          return (elem as Seguidor).anomaliasCliente.filter((anom) => GLOBAL.fixableTypes.includes(anom.tipo)).length == 0;
        } else {
          return (elem as Seguidor).anomaliasCliente.filter((anom) => !GLOBAL.fixableTypes.includes(anom.tipo)).length == 0;
        }
      } else {
        if (this.reparable) {
            return GLOBAL.fixableTypes.includes(elem.tipo);
          } else {
            return !GLOBAL.fixableTypes.includes(elem.tipo);
          }
      }
    });
  }
  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
