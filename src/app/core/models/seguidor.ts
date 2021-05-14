import { LatLngLiteral } from '@agm/core';
import { Coordinate } from 'ol/coordinate';
import { fromLonLat } from 'ol/proj';

import { Anomalia } from './anomalia';
import { FilterableElement } from './filtrableInterface';
import { ModuloInterface } from './modulo';

export class Seguidor implements FilterableElement {
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
  featureCoords?: Coordinate[];
  nombre?: string;
  celsCalientes?: number;
  moduloLabel?: string;

  constructor(
    anomalias: Anomalia[],
    filas: number,
    columnas: number,
    path: LatLngLiteral[],
    plantaId: string,
    informeId: string,
    modulo: ModuloInterface,
    globalCoords: string[],
    id?: string,
    nombre?: string
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
    this.featureCoords = this.pathToCoordinate(path);
    this.nombre = nombre;
    this.celsCalientes = this.getCelsCalientes(anomalias);
    this.moduloLabel = this.getModuloLabel();
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

  private pathToCoordinate(path: LatLngLiteral[]): Coordinate[] {
    const coordenadas: Coordinate[] = [];
    path.forEach((coord) => {
      const coordenada: Coordinate = fromLonLat([coord.lng, coord.lat]);
      coordenadas.push(coordenada);
    });
    return coordenadas;
  }

  private getCelsCalientes(anomalias: Anomalia[]): number {
    const celsCalientes = anomalias.filter((anom) => anom.tipo == 8 || anom.tipo == 9).length;

    return celsCalientes / (this.filas * this.columnas);
  }

  private getModuloLabel(): string {
    let moduloLabel: string;
    if (this.modulo !== undefined) {
      if (this.modulo.marca === undefined) {
        if (this.modulo.modelo === undefined) {
          moduloLabel = this.modulo.potencia + 'W';
        } else {
          moduloLabel = this.modulo.modelo + ' ' + this.modulo.potencia + 'W';
        }
      } else {
        if (this.modulo.modelo === undefined) {
          moduloLabel = this.modulo.marca + ' ' + this.modulo.potencia + 'W';
        } else {
          moduloLabel = this.modulo.marca + ' ' + this.modulo.modelo + ' ' + this.modulo.potencia + 'W';
        }
      }
    } else {
      moduloLabel = 'Desconocido';
    }

    return moduloLabel;
  }
}
