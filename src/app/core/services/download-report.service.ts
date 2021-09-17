import { Injectable } from '@angular/core';
import { Anomalia } from '@core/models/anomalia';

import { FilterableElement } from '@core/models/filterableInterface';
import { PlantaInterface } from '@core/models/planta';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DownloadReportService {
  private _generatingPDF = false;
  generatingPDF$ = new BehaviorSubject<boolean>(this._generatingPDF);
  private _endingPDF = false;
  endingPDF$ = new BehaviorSubject<boolean>(this._endingPDF);
  private _progressBarValue = 0;
  progressBarValue$ = new BehaviorSubject<number>(this._progressBarValue);
  private _filteredPDF: boolean = undefined;
  filteredPDF$ = new BehaviorSubject<boolean>(this._filteredPDF);
  private _downloadPDF = false;
  downloadPDF$ = new BehaviorSubject<boolean>(this._downloadPDF);

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
    } else {
      return (altura + '/' + anomalia.localX).toString();
    }
  }

  getAltura(planta: PlantaInterface, localY: number) {
    // Por defecto, la altura alta es la numero 1
    if (planta.alturaBajaPrimero) {
      return planta.filas - (localY - 1);
    } else {
      return localY;
    }
  }

  //////////////////////////////////////////////////////

  get generatingPDF() {
    return this._generatingPDF;
  }

  set generatingPDF(value: boolean) {
    this._generatingPDF = value;
    this.generatingPDF$.next(value);
  }

  get endingPDF() {
    return this._endingPDF;
  }

  set endingPDF(value: boolean) {
    this._endingPDF = value;
    this.endingPDF$.next(value);
  }

  get progressBarValue() {
    return this._progressBarValue;
  }

  set progressBarValue(value: number) {
    this._progressBarValue = value;
    this.progressBarValue$.next(value);
  }

  get filteredPDF() {
    return this._filteredPDF;
  }

  set filteredPDF(value: boolean) {
    this._filteredPDF = value;
    this.filteredPDF$.next(value);
  }

  get downloadPDF() {
    return this._endingPDF;
  }

  set downloadPDF(value: boolean) {
    this._downloadPDF = value;
    this.downloadPDF$.next(value);
  }
}
