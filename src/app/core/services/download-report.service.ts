import { Injectable } from '@angular/core';
import { Anomalia } from '@core/models/anomalia';

import { FilterableElement } from '@core/models/filterableInterface';
import { PlantaInterface } from '@core/models/planta';

@Injectable({
  providedIn: 'root',
})
export class DownloadReportService {
  constructor() {}

  sortByPosition(a: FilterableElement, b: FilterableElement): number {
    if (this.sortByGlobalCoords(a, b) !== 0) {
      return this.sortByGlobalCoords(a, b);
    }
    // Mismas Globals
    if (a.localY < b.localY) {
      return -1;
    }
    if (a.localY > b.localY) {
      return 1;
    }
    // Mismo localY
    if (a.localX < b.localX) {
      return -1;
    }
    if (a.localX > b.localX) {
      return 1;
    }
    // Mismos localX y localY
    return 0;
  }

  sortByGlobalCoords(a: FilterableElement, b: FilterableElement): number {
    let globalCoordsLength;
    a.globalCoords.forEach((coord, index) => {
      if (coord !== undefined && coord !== null && coord !== '') {
        globalCoordsLength = index + 1;
      }
    });

    let value = 0;

    for (let index = 0; index < globalCoordsLength; index++) {
      if (a.globalCoords[index] < b.globalCoords[index]) {
        value = -1;
        break;
      }
      if (a.globalCoords[index] > b.globalCoords[index]) {
        value = 1;
        break;
      }
    }

    return value;
  }

  getPositionModulo(planta: PlantaInterface, anomalia: Anomalia): string {
    const altura = this.getAltura(planta, anomalia.localY);
    if (
      planta.hasOwnProperty('etiquetasLocalXY') &&
      planta.etiquetasLocalXY[altura] !== undefined &&
      planta.etiquetasLocalXY[altura][anomalia.localX - 1] !== undefined
    ) {
      return planta.etiquetasLocalXY[altura][anomalia.localX - 1];
    }

    return (altura + '/' + anomalia.localX).toString();
  }

  getAltura(planta: PlantaInterface, localY: number) {
    // Por defecto, la altura alta es la numero 1
    if (planta.alturaBajaPrimero) {
      return planta.filas - (localY - 1);
    } else {
      return localY;
    }
  }
}
