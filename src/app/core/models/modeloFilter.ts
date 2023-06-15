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

  setModuleLabel(module: ModuloInterface): string{
    // Si el módulo tiene marca, se muestra la marca y la potencia
    let label: string;
    if (module.marca) {
      label = `${module.marca} (${module.potencia}W)`;
    } else {
      label = `${module.potencia}W`;
    }
    return label
  }
}
