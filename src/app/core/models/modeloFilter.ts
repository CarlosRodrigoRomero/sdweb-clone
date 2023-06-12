import { FilterInterface } from './filter';
import { FilterableElement } from './filterableInterface';

export class ModeloFilter implements FilterInterface {
  id: string;
  type: string;
  marca: string;
  modelo: string;
  potencia: number;

  constructor(id: string, type: string, marca: string, potencia?: number, modelo?: string,) {
    this.id = id;
    this.type = type;
    this.marca = marca;
    this.modelo = modelo;
    this.potencia = potencia;
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    return elems.filter((elem) => elem.modulo.marca == this.marca && elem.modulo.potencia == this.potencia);
  }
  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
