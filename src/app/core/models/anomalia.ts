import { Coordinate } from 'ol/coordinate.js';

import { FilterableElement } from './filterableInterface';
import { ModuloInterface } from './modulo';

export class Anomalia implements FilterableElement {
  id?: string;
  plantaId: string;
  informeId: string;
  tipo: number;
  globalCoords: string[];
  clase?: number;
  perdidas?: number;
  gradiente?: number;
  gradienteNormalizado: number;
  temperaturaMax: number;
  modulo: ModuloInterface;
  temperaturaRef?: number;
  datetime?: number;
  criticidad?: number;
  featureCoords: Coordinate[];
  featureType: string;
  modulosAfectados?: number;
  archivoPublico?: string;
  archivo?: string;
  localId?: string;
  localX?: number;
  localY?: number;
  irradiancia?: number;

  camaraModelo?: string;
  camaraSN?: number;
  vientoVelocidad?: number;
  vientoDireccion?: number;

  constructor(
    tipo: number,
    globalCoords: string[],
    clase: number,
    perdidas: number,
    gradienteNormalizado: number,
    temperaturaMax: number,
    modulo: ModuloInterface,
    temperaturaRef: number,
    featureCoords: Coordinate[],
    featureType: string,
    plantaId: string,
    informeId: string
  ) {
    this.tipo = tipo;
    this.globalCoords = globalCoords;
    this.clase = clase;
    this.perdidas = perdidas;
    this.gradienteNormalizado = gradienteNormalizado;
    this.temperaturaMax = temperaturaMax;
    this.modulo = modulo;
    this.temperaturaRef = temperaturaRef;
    this.featureCoords = featureCoords;
    this.featureType = featureType;
    this.plantaId = plantaId;
    this.informeId = informeId;
  }
}
