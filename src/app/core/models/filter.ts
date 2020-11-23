import { FilterAreaInterface } from './filterArea';
import { PcInterface } from './pc';

export interface FilterInterface {
  id?: string;

  applyFilter(pcs: PcInterface[]): PcInterface[];
  desaplicarFiltro(pcs: PcInterface[]): PcInterface[];
}
