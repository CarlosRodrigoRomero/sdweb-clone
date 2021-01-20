import { FilterInterface } from './filter';
import { PcInterface } from './pc';

export class GradientFilter implements FilterInterface {
  valorGradiente: number;

  constructor(valorGradiente: number) {
    this.valorGradiente = valorGradiente;
  }

  applyFilter(pcs: PcInterface[]): PcInterface[] {
    /* return pcs.filter(
      (pc) =>
        pc.gradienteNormalizado >= this.valorGradiente ||
        (pc.gradienteNormalizado === 10 && (pc.tipo === 11 || pc.tipo === 15)) ||
        (pc.gradienteNormalizado < this.valorGradiente &&
          pc.tipo !== 8 &&
          pc.tipo !== 9 &&
          pc.tipo !== 11 &&
          pc.tipo !== 15)
    ); */
    return pcs.filter(
      (pc) =>
        pc.gradienteNormalizado >= this.valorGradiente ||
        (pc.gradienteNormalizado < this.valorGradiente && pc.tipo !== 8 && pc.tipo !== 9)
    );
  }
  unapplyFilter(pcs: PcInterface[]): PcInterface[] {
    return null;
  }
}
