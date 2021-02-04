import { FilterInterface } from './filter';
import { FiltrableInterface } from './filtrableInterface';

export class ModuloPcFilter implements FilterInterface {
  id: string;
  type: string;
  modulo: string;

  constructor(id: string, type: string, modulo: string) {
    this.id = id;
    this.type = type;
    this.modulo = modulo;
  }

  applyFilter(pcs: FiltrableInterface[]): FiltrableInterface[] {
    return pcs.filter((pc) => this.getModuloLabelPc(pc) === this.modulo);
  }
  unapplyFilter(pcs: FiltrableInterface[]): FiltrableInterface[] {
    return null;
  }

  private getModuloLabelPc(pc: FiltrableInterface): string {
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
