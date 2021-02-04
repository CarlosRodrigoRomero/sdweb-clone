import { FiltrableInterface } from './filtrableInterface';


export interface FilterInterface {
  id?: string;
  type?: string;

  applyFilter(pcs: FiltrableInterface[]): FiltrableInterface[];
  unapplyFilter(pcs: FiltrableInterface[]): FiltrableInterface[];
}
