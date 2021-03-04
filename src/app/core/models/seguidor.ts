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
  plantaId?: string;
  informeId?: string;
  filas: number;
  columnas: number;
  path: LatLngLiteral[];

  constructor(anomalias: Anomalia[], filas: number, columnas: number, path: LatLngLiteral[], plantaId: string) {
    this.anomalias = anomalias;
    this.plantaId = plantaId;
    this.filas = filas;
    this.columnas = columnas;
    this.perdidas = this.getPerdidas(anomalias);
    this.temperaturaMax = this.getTempMax();
    this.mae = this.getMae();
    this.gradienteNormalizado = this.getGradienteNormMax();
    this.informeId = this.getInformeId();
    this.modulo = this.getModulo();
    this.globalCoords = this.getGlobalCoords();
    this.path = path;
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
    return Math.max(
      ...this.anomalias
        .filter((anomalia) => anomalia.temperaturaMax !== undefined)
        .map((anomalia) => anomalia.temperaturaMax)
    );
  }

  private getGradienteNormMax(): number {
    return Math.max(
      ...this.anomalias
        .filter((anomalia) => anomalia.gradienteNormalizado !== undefined)
        .map((anomalia) => anomalia.gradienteNormalizado)
    );
  }

  private getInformeId(): string {
    return this.anomalias.find((anomalia) => anomalia.informeId !== undefined).informeId;
  }

  private getModulo(): ModuloInterface {
    return this.anomalias.find((anomalia) => anomalia.modulo !== undefined).modulo;
  }

  private getGlobalCoords(): string[] {
    return this.anomalias[0].globalCoords;
    // return this.anomalias.find((anomalia) => anomalia.globalCoords !== undefined).globalCoords;
  }
}
