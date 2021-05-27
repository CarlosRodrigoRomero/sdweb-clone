import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';

export class ModuloPcFilter implements FilterInterface {
  id: string;
  type: string;
  modulo: string;

  constructor(id: string, type: string, modulo: string) {
    this.id = id;
    this.type = type;
    this.modulo = modulo;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    return elems.filter((elem) => this.getModuloLabelPc(elem) === this.modulo);
  }
  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }

  private getModuloLabelPc(pc: FilterableElement): string {
    let moduloLabel: string;
    if (pc.modulo.marca === undefined) {
      if (pc.modulo.modelo === undefined) {
        moduloLabel = pc.modulo.potencia + 'W';
      } else {
        moduloLabel = pc.modulo.modelo + ' ' + pc.modulo.potencia + 'W';
      }
    } else {
      if (pc.modulo.modelo === undefined) {
        moduloLabel = pc.modulo.marca + ' ' + pc.modulo.potencia + 'W';
      } else {
        moduloLabel = pc.modulo.marca + ' ' + pc.modulo.modelo + ' ' + pc.modulo.potencia + 'W';
      }
    }
    return moduloLabel;
  }
}
