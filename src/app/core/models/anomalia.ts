import { Coordinate } from 'ol/coordinate';
import { FiltrableInterface } from './filtrableInterface';
import { ModuloInterface } from './modulo';

export class Anomalia implements FiltrableInterface {
  //FiltrableInterface
  tipo: number;
  globalCoords: string[];
  clase: number;
  perdidas: number;
  gradienteNormalizado: number;
  temperaturaMax: number;
  modulo: ModuloInterface;
  temperaturaRef: number;
  //
  featureCoords: Coordinate[];
  featureType: string;
  id?: string;
  plantaId: string;
  informeId: string;
  modulosAfectados?: number;

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
