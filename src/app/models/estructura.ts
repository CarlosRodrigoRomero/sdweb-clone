import { GLOBAL } from '../services/global';
import { ElementoPlantaInterface } from './elementoPlanta';
import { LatLngLiteral } from '@agm/core';
import { ModuloInterface } from './modulo';
export interface EstructuraInterface {
  id?: string;
  archivo: string;
  vuelo: string;
  coords: any[];
  filas: number;
  columnas: number;
  sentido: boolean; // false: izq->drcha | true: drcha -> izq
  columnaInicio: number;
  filaInicio: number;
  latitud: number;
  longitud: number;
  globalCoords?: any[];
  modulo?: ModuloInterface;
}

export class Estructura implements EstructuraInterface, ElementoPlantaInterface {
  id: string;
  archivo: string;
  vuelo: string;
  coords: any[];
  filas: number;
  columnas: number;
  sentido: boolean; // false: izq->drcha | true: drcha -> izq
  columnaInicio: number;
  filaInicio: number;

  latitud: number;
  longitud: number;
  globalCoords: any[];
  modulo?: ModuloInterface;

  constructor(est: EstructuraInterface) {
    this.id = est.id;
    this.archivo = est.archivo;
    this.vuelo = est.vuelo;
    this.coords = est.coords;
    this.filas = est.filas;
    this.columnas = est.columnas;
    this.sentido = est.sentido;
    this.columnaInicio = est.columnaInicio;
    this.filaInicio = est.filaInicio;
    this.latitud = est.latitud;
    this.longitud = est.longitud;
    this.modulo = est.modulo;

    let globalCoords;
    if (!est.hasOwnProperty('globalCoords')) {
      globalCoords = [];
    } else {
      globalCoords = est.globalCoords;
    }
    for (let i = globalCoords.length; i < GLOBAL.numGlobalCoords; i++) {
      globalCoords.push('');
    }
    this.globalCoords = globalCoords;
  }

  getLatLng(): LatLngLiteral {
    return { lat: this.latitud, lng: this.longitud };
  }
  setLatLng(latLng: LatLngLiteral): void {
    this.latitud = latLng.lat;
    this.longitud = latLng.lng;
  }
  setGlobals(globals: any[]) {
    globals.forEach((v, i, array) => {
      this.globalCoords[i] = v;
    });
  }
  setModulo(modulo: ModuloInterface) {
    this.modulo = modulo;
  }
}
