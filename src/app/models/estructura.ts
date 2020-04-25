import { GLOBAL } from '../services/global';
import { ElementoPlantaInterface } from './elementoPlanta';
import { LatLngLiteral } from '@agm/core';
export interface EstructuraInterface {
  id?: string;
  archivo: string;
  coords: any[];
  filas: number;
  columnas: number;
  sentido: boolean; // false: izq->drcha | true: drcha -> izq
  columnaInicio: number;
  filaInicio: number;
  vuelo: string;
  latitud: number;
  longitud: number;
  globalCoords?: any[];
}

export class Estructura implements EstructuraInterface, ElementoPlantaInterface {
  id: string;
  archivo: string;
  coords: any[];
  filas: number;
  columnas: number;
  sentido: boolean; // false: izq->drcha | true: drcha -> izq
  columnaInicio: number;
  filaInicio: number;
  vuelo: string;
  latitud: number;
  longitud: number;
  globalCoords: any[];

  constructor(est: EstructuraInterface) {
    this.id = est.id;
    this.archivo = est.archivo;
    this.coords = est.coords;
    this.filas = est.filas;
    this.columnas = est.columnas;
    this.sentido = est.sentido;
    this.columnaInicio = est.columnaInicio;
    this.filaInicio = est.filaInicio;
    this.vuelo = est.vuelo;
    this.latitud = est.latitud;
    this.longitud = est.longitud;

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
}
