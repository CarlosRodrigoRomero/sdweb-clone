import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';
import { ModuloInterface } from './modulo';

export class ModeloFilter implements FilterInterface {
  id: string;
  type: string;
  modulo: string;
  numOfModelos: number;
  position: number;

  constructor(id: string, type: string, modulo: string, numOfModelos: number, position: number) {
    this.id = id;
    this.type = type;
    this.modulo = modulo;
    this.numOfModelos = numOfModelos;
    this.position = position;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    return elems.filter((elem) => this.setModuleLabel(elem.modulo) == this.modulo);
  }
  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }

  setModuleLabel(module: ModuloInterface): string {
    let label: string;
    if (module !== null && module !== undefined) {
      if (module?.marca) {
        label = `${module.marca}`;
      }
    }
    return label;
  }
}
