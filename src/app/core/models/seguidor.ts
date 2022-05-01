import { LatLngLiteral } from '@agm/core';

import { Coordinate } from 'ol/coordinate';
import { fromLonLat } from 'ol/proj';

import { GLOBAL } from '@data/constants/global';

import { Anomalia } from './anomalia';
import { FilterableElement } from './filterableInterface';
import { ModuloInterface } from './modulo';

export class Seguidor implements FilterableElement {
  // Filtrable Interface
  anomalias: Anomalia[];
  anomaliasCliente?: Anomalia[]; // anomalias sin tipo 0 y sin criticidad null
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
  imageName?: string;

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
    // tslint:disable-next-line: triple-equals
    this.anomaliasCliente = anomalias.filter(
      (anom) => !GLOBAL.tipos_no_utilizados.includes(anom.tipo) && anom.criticidad !== null
    );
    this.plantaId = plantaId;
    this.filas = filas;
    this.columnas = columnas;
    this.perdidas = this.getPerdidas(this.anomaliasCliente);
    this.temperaturaMax = this.getTempMax();
    this.mae = this.perdidas;
    this.gradienteNormalizado = this.getGradienteNormMax();
    this.informeId = informeId;
    this.modulo = modulo;
    this.globalCoords = globalCoords;
    this.path = path;
    this.id = id;
    this.featureCoords = this.pathToCoordinate(path);
    this.nombre = nombre;
    this.celsCalientes = this.getCelsCalientes(this.anomaliasCliente);
    this.moduloLabel = this.getModuloLabel();
  }

  private getPerdidas(anomalias: Anomalia[]): number {
    let sumaPerdidas = 0;
    if (anomalias.length > 0) {
      anomalias.forEach((anomalia) => {
        if (anomalia.perdidas !== undefined) {
          sumaPerdidas += anomalia.perdidas;
        }
      });
    }
    let mae = 0;
    if (sumaPerdidas > 0) {
      mae = sumaPerdidas / (this.filas * this.columnas);
    }
    return mae;
  }

  // private getMae(): number {
  //   let mae = 0;
  //   if (this.perdidas !== 0) {
  //     mae = this.perdidas / (this.filas * this.columnas);
  //   }
  //   return mae;
  // }

  private getTempMax(): number {
    let tempMax = 0;
    if (this.anomaliasCliente.length > 0) {
      const temps = this.anomaliasCliente
        .filter((anomalia) => anomalia.temperaturaMax !== undefined)
        .map((anomalia) => anomalia.temperaturaMax);
      if (temps.length > 0) {
        tempMax = Math.max(...temps);
      }
    }
    return tempMax;
  }

  private getGradienteNormMax(): number {
    let gradNormMax = 0;
    if (this.anomaliasCliente.length > 0) {
      const gradientes = this.anomaliasCliente
        .filter((anomalia) => anomalia.gradienteNormalizado !== undefined)
        .map((anomalia) => anomalia.gradienteNormalizado);
      if (gradientes.length > 0) {
        gradNormMax = Math.max(...gradientes);
      }
    }
    return gradNormMax;
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
    let celsCalientes = 0;

    if (anomalias.length > 0) {
      const numCelsCalientes =
        // tslint:disable-next-line: triple-equals
        anomalias.filter((anom) => anom.tipo == 8 || anom.tipo == 9).length;
      if (numCelsCalientes > 0) {
        celsCalientes = numCelsCalientes / (this.filas * this.columnas);
      }
    }

    return celsCalientes;
  }

  private getModuloLabel(): string {
    let moduloLabel: string;
    if (this.modulo !== undefined && this.modulo !== null) {
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
