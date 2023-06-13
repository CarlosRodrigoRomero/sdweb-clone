import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';
import { ModuloInterface } from './modulo';

export class ModeloFilter implements FilterInterface {
  id: string;
  type: string;
  modulo: string;
  modelo: string;
  potencia: number;

  constructor(id: string, type: string, modulo: string, potencia?: number, modelo?: string,) {
    this.id = id;
    this.type = type;
    this.modulo = modulo;
    this.modelo = modelo;
    this.potencia = potencia;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    return elems.filter((elem) => this.setModuleLabel(elem.modulo) == this.modulo);
  }
  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }

  // Obtenemos la marca y la potencia del módulo a partir de su label
  getModuleProperties(label: string) {
    var marca = label.split(' ').slice(0, -1).join(' ');
    // Para la potencia tenemos que quitarle el último caracter que es un 'W' y los paréntesis
    var potencia = Number(label.split(' ').slice(-1)[0].slice(1, -2));
    return {marca, potencia};
  }

  setModuleLabel(module: ModuloInterface): string{
    let label: string;
    if (module.marca) {
      label = `${module.marca} (${module.potencia}W)`;
    } else {
      label = `${module.potencia}W`;
    }
    return label
  }
}
