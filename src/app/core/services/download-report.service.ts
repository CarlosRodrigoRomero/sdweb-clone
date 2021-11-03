import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

import { PlantaService } from '@core/services/planta.service';

import { FilterableElement } from '@core/models/filterableInterface';
import { PlantaInterface } from '@core/models/planta';
import { Anomalia } from '@core/models/anomalia';
import { LocationAreaInterface } from '@core/models/location';
import { LatLngLiteral } from '@agm/core';
import { Coordinate } from 'ol/coordinate';
import { fromLonLat } from 'ol/proj';

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
  private _seguidores1Eje: LocationAreaInterface[] = [];
  seguidores1Eje$ = new BehaviorSubject<LocationAreaInterface[]>(this._seguidores1Eje);
  private allLocAreas: LocationAreaInterface[] = [];

  constructor(private plantaService: PlantaService) {}

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

  getSeguidores1Eje(plantaId: string) {
    this.plantaService
      .getLocationsArea(plantaId)
      .pipe(take(1))
      .subscribe((locAreaList) => {
        // guardamos todas las areas
        this.allLocAreas = locAreaList;

        // detectamos la globalCoords mas pequeña que es la utilizaremos para el seguidor
        const coordsLength = locAreaList[0].globalCoords.length;

        let indiceSeleccionado;

        for (let index = coordsLength - 1; index >= 0; index--) {
          const notNullLocAreas = locAreaList.filter(
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

        // filtramos las areas seleccionadas para los seguidores
        this.seguidores1Eje = locAreaList.filter(
          (locArea) =>
            locArea.globalCoords[indiceSeleccionado] !== null &&
            locArea.globalCoords[indiceSeleccionado] !== undefined &&
            locArea.globalCoords[indiceSeleccionado] !== ''
        );
      });
  }

  getCompleteGlobalCoords(seg: LocationAreaInterface): any[] {
    return this.plantaService.getGlobalCoordsFromLocationAreaOl(this.pathToCoordinate(seg.path)[0], this.allLocAreas);
  }

  pathToCoordinate(path: LatLngLiteral[]): Coordinate[] {
    const coordenadas: Coordinate[] = [];
    path.forEach((coord) => {
      const coordenada: Coordinate = fromLonLat([coord.lng, coord.lat]);
      coordenadas.push(coordenada);
    });
    return coordenadas;
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

  get seguidores1Eje() {
    return this._seguidores1Eje;
  }

  set seguidores1Eje(value: LocationAreaInterface[]) {
    this._seguidores1Eje = value;
    this.seguidores1Eje$.next(value);
  }
}
