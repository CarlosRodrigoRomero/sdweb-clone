import { PcInterface } from './pc';

export interface FilterInterface {
  id?: string;

  applyFilter(pcs: PcInterface[]): PcInterface[];
  unapplyFilter(pcs: PcInterface[]): PcInterface[];
}
