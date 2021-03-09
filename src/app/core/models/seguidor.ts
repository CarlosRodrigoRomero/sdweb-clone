import { LatLngLiteral } from '@agm/core';

import { Anomalia } from './anomalia';
import { FiltrableInterface } from './filtrableInterface';
import { ModuloInterface } from './modulo';

export class Seguidor implements FiltrableInterface {
  // Filtrable Interface
  anomalias: Anomalia[];
  globalCoords: string[];
  perdidas: number; // sumatorio de perdidas de los modulos del seguidor
  temperaturaMax: number; // temperatura máxima en el seguidor
  modulo: ModuloInterface;
  gradienteNormalizado: number; // gradiente maximo en el seguidor
  //
  id?: string;
  mae: number; // modulos apagados equivalentes en el seguidor
  incrementoMae: number;
  plantaId?: string;
  informeId?: string;
  filas: number;
  columnas: number;
  path: LatLngLiteral[];

  constructor(
    anomalias: Anomalia[],
    filas: number,
    columnas: number,
    path: LatLngLiteral[],
    plantaId: string,
    informeId: string,
    modulo: ModuloInterface,
    globalCoords: string[],
    id?: string
  ) {
    this.anomalias = anomalias;
    this.plantaId = plantaId;
    this.filas = filas;
    this.columnas = columnas;
    this.perdidas = this.getPerdidas(anomalias);
    this.temperaturaMax = this.getTempMax();
    this.mae = this.getMae();
    this.gradienteNormalizado = this.getGradienteNormMax();
    this.informeId = informeId;
    this.modulo = modulo;
    this.globalCoords = globalCoords;
    this.path = path;
    this.id = id;
  }

  private getPerdidas(anomalias: Anomalia[]): number {
    let suma = 0;
    anomalias.forEach((anomalia) => {
      if (anomalia.perdidas !== undefined) {
        suma += anomalia.perdidas;
      }
    });
    return suma;
  }

  private getMae(): number {
    return this.perdidas / (this.filas * this.columnas);
  }

  private getTempMax(): number {
    if (this.anomalias.length > 0) {
      return Math.max(
        ...this.anomalias
          .filter((anomalia) => anomalia.temperaturaMax !== undefined)
          .map((anomalia) => anomalia.temperaturaMax)
      );
    }
    return 0;
  }

  private getGradienteNormMax(): number {
    if (this.anomalias.length > 0) {
      return Math.max(
        ...this.anomalias
          .filter((anomalia) => anomalia.gradienteNormalizado !== undefined)
          .map((anomalia) => anomalia.gradienteNormalizado)
      );
    }
    return 0;
  }
}
