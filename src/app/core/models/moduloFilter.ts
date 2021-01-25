import { FilterInterface } from './filter';
import { PcInterface } from './pc';

export class ModuloPcFilter implements FilterInterface {
  id: string;
  type: string;
  modulo: string;

  constructor(id: string, type: string, modulo: string) {
    this.id = id;
    this.type = type;
    this.modulo = modulo;
  }

  applyFilter(pcs: PcInterface[]): PcInterface[] {
    return pcs.filter((pc) => this.getModuloLabelPc(pc) === this.modulo);
  }
  unapplyFilter(pcs: PcInterface[]): PcInterface[] {
    return null;
  }

  private getModuloLabelPc(pc: PcInterface): string {
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
