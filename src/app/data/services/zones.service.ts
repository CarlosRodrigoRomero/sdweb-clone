import { Injectable } from '@angular/core';

import { PlantaService } from './planta.service';

import { LocationAreaInterface } from '@core/models/location';
import { PlantaInterface } from '@core/models/planta';

@Injectable({
  providedIn: 'root',
})
export class ZonesService {
  constructor(private plantaService: PlantaService) {}

  getZones(planta: PlantaInterface, locAreas: LocationAreaInterface[]) {
    // obtenemos las areas descartando las que no tienen globals, que son las de los modulos
    const realLocAreas = locAreas.filter(
      (locArea) => locArea.globalCoords.toString() !== ',' && locArea.globalCoords.toString() !== ''
    );

    if (planta.tipo === 'seguidores') {
      // detectamos la globalCoords mas pequeña que es la utilizaremos para el seguidor
      const indiceSeleccionado = this.getIndiceGlobalCoordsSeguidores(realLocAreas);

      // filtramos las areas seleccionadas para los seguidores
      const locAreaSeguidores = realLocAreas.filter(
        (locArea) =>
          locArea.globalCoords[indiceSeleccionado] !== null &&
          locArea.globalCoords[indiceSeleccionado] !== undefined &&
          locArea.globalCoords[indiceSeleccionado] !== ''
      );

      // filtramos las areas que no son seguidores
      const locAreaNoSeguidores = realLocAreas.filter((locArea) => !locAreaSeguidores.includes(locArea));

      return locAreaNoSeguidores;
    } else {
      return realLocAreas;
    }
  }

  getIndiceGlobalCoordsSeguidores(locAreas: LocationAreaInterface[]): number {
    const coordsLength = locAreas[0].globalCoords.length;

    let indiceSeleccionado;

    for (let index = coordsLength - 1; index >= 0; index--) {
      const notNullLocAreas = locAreas.filter(
        (locArea) =>
          locArea.globalCoords[index] !== undefined &&
          locArea.globalCoords[index] !== null &&
          locArea.globalCoords[index] !== ''
      );

      if (notNullLocAreas.length > 0) {
        indiceSeleccionado = index;

        break;
      }
    }

    return indiceSeleccionado;
  }
}
