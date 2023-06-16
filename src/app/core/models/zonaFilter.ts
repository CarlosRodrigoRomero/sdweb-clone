import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';

export class ZonaFilter implements FilterInterface {
  id: string;
  type: string;
  zona: string;
  numOfZonas: number;
  position: number;


  constructor(id: string, type: string, zona: string, numOfZonas: number, position: number) {
    this.id = id;
    this.type = type;
    this.zona = zona;
    this.numOfZonas = numOfZonas;
    this.position = position; 
  }

  applyFilter(pcs: FilterableElement[]): FilterableElement[] {
    return pcs.filter((pc) => pc.globalCoords[0] === this.zona);
  }
  unapplyFilter(pcs: FilterableElement[]): FilterableElement[] {
    return null;
  }
}