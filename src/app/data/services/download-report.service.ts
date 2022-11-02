import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

import inside from 'point-in-polygon';

import { Coordinate } from 'ol/coordinate';
import { fromLonLat } from 'ol/proj';

import { LatLngLiteral } from '@agm/core';

import { PlantaService } from '@data/services/planta.service';
import { OlMapService } from './ol-map.service';

import { FilterableElement } from '@core/models/filterableInterface';
import { PlantaInterface } from '@core/models/planta';
import { Anomalia } from '@core/models/anomalia';
import { LocationAreaInterface } from '@core/models/location';

@Injectable({
  providedIn: 'root',
})
export class DownloadReportService {
  private _generatingDownload = false;
  generatingDownload$ = new BehaviorSubject<boolean>(this._generatingDownload);
  private _endingDownload = false;
  endingDownload$ = new BehaviorSubject<boolean>(this._endingDownload);
  private _progressBarValue = 0;
  progressBarValue$ = new BehaviorSubject<number>(this._progressBarValue);
  private _progressBarMode = 'indeterminate';
  progressBarMode$ = new BehaviorSubject<string>(this._progressBarMode);
  private _filteredPDF: boolean = undefined;
  filteredPDF$ = new BehaviorSubject<boolean>(this._filteredPDF);
  private _seguidores1Eje: LocationAreaInterface[] = [];
  seguidores1Eje$ = new BehaviorSubject<LocationAreaInterface[]>(this._seguidores1Eje);
  private noS1EsLocAreas: LocationAreaInterface[] = [];
  private _englishLang = false;
  englishLang$ = new BehaviorSubject<boolean>(this._englishLang);
  private _typeDownload = 'pdf';
  typeDownload$ = new BehaviorSubject<string>(this._typeDownload);
  private _simplePDF = true;
  simplePDF$ = new BehaviorSubject<boolean>(this._simplePDF);

  constructor(private plantaService: PlantaService, private olMapService: OlMapService) {}

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

  getPositionModulo(planta: PlantaInterface, altura: number, columna: number): string {
    if (
      planta.hasOwnProperty('etiquetasLocalXY') &&
      planta.etiquetasLocalXY[altura] !== undefined &&
      planta.etiquetasLocalXY[altura][columna - 1] !== undefined
    ) {
      return planta.etiquetasLocalXY[altura][columna - 1];
    } else {
      return (altura + '/' + columna).toString();
    }
  }

  getSeguidores1Eje(plantaId: string) {
    this.plantaService
      .getLocationsArea(plantaId)
      .pipe(take(1))
      .subscribe((locAreaList) => {
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
        const segs1Eje = locAreaList.filter(
          (locArea) =>
            locArea.globalCoords[indiceSeleccionado] !== null &&
            locArea.globalCoords[indiceSeleccionado] !== undefined &&
            locArea.globalCoords[indiceSeleccionado] !== ''
        );

        this.noS1EsLocAreas = locAreaList
          .filter((locArea) => !segs1Eje.includes(locArea))
          .filter((locArea) => locArea.globalCoords.toString() !== ',' && locArea.globalCoords.toString() !== '');

        segs1Eje.forEach((seg) => (seg.globalCoords = this.getCompleteGlobalCoords(seg, indiceSeleccionado)));

        this.seguidores1Eje = segs1Eje;
      });
  }

  getNombreS1E(seg: LocationAreaInterface): string {
    let nombreS1E = '';
    if (seg !== undefined) {
      seg.globalCoords.forEach((gC, index) => {
        let globalCoord = gC.toString();
        if (globalCoord.length === 1) {
          globalCoord = '0' + globalCoord;
        }
        nombreS1E += globalCoord;
        if (index < seg.globalCoords.length - 1) {
          nombreS1E += '.';
        }
      });
    }

    return nombreS1E;
  }

  getCompleteGlobalCoords(seg: LocationAreaInterface, indexSelected: number): any[] {
    const globalCoords = seg.globalCoords;

    this.noS1EsLocAreas.forEach((locArea) => {
      const centroid = this.olMapService.getCentroid(this.pathToCoordinate(seg.path));
      const polygon = this.pathToCoordinate(locArea.path);

      if (inside(centroid, polygon)) {
        locArea.globalCoords.forEach((coord, index) => {
          if (index < indexSelected && coord !== undefined && coord !== null && coord !== '') {
            globalCoords[index] = coord;
          }
        });
      }
    });

    return globalCoords;
  }

  pathToCoordinate(path: LatLngLiteral[]): Coordinate[] {
    const coordenadas: Coordinate[] = [];
    path.forEach((coord) => {
      const coordenada: Coordinate = fromLonLat([coord.lng, coord.lat]);
      coordenadas.push(coordenada);
    });
    return coordenadas;
  }

  resetService() {
    // reiniciamos los valores
    this.generatingDownload = false;
    this.endingDownload = false;
    this.progressBarValue = 0;
    this.progressBarMode = 'determinate';
    this.filteredPDF = undefined;
    this.seguidores1Eje = [];
    this.noS1EsLocAreas = [];
    this.englishLang = false;
    this.typeDownload = 'pdf';
  }

  //////////////////////////////////////////////////////

  get generatingDownload() {
    return this._generatingDownload;
  }

  set generatingDownload(value: boolean) {
    this._generatingDownload = value;
    this.generatingDownload$.next(value);
  }

  get endingDownload() {
    return this._endingDownload;
  }

  set endingDownload(value: boolean) {
    this._endingDownload = value;
    this.endingDownload$.next(value);
  }

  get progressBarValue() {
    return this._progressBarValue;
  }

  set progressBarValue(value: number) {
    this._progressBarValue = value;
    this.progressBarValue$.next(value);
  }

  get progressBarMode(): string {
    return this._progressBarMode;
  }

  set progressBarMode(value: string) {
    this._progressBarMode = value;
    this.progressBarMode$.next(value);
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

  get englishLang() {
    return this._englishLang;
  }

  set englishLang(value: boolean) {
    this._englishLang = value;
    this.englishLang$.next(value);
  }

  get typeDownload(): string {
    return this._typeDownload;
  }

  set typeDownload(value: string) {
    this._typeDownload = value;
    this.typeDownload$.next(value);
  }

  get simplePDF(): boolean {
    return this._simplePDF;
  }

  set simplePDF(value: boolean) {
    this._simplePDF = value;
    this.simplePDF$.next(value);
  }
}
