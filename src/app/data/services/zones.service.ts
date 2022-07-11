import { Injectable } from '@angular/core';

import { take } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

import * as turf from '@turf/turf';

import PointInPolygon from 'point-in-polygon';

import { PlantaService } from './planta.service';
import { OlMapService } from './ol-map.service';

import { LocationAreaInterface } from '@core/models/location';
import { PlantaInterface } from '@core/models/planta';

@Injectable({
  providedIn: 'root',
})
export class ZonesService {
  locAreas: LocationAreaInterface[] = [];
  zones: LocationAreaInterface[] = [];
  zonesBySize: LocationAreaInterface[][] = [];
  private _thereAreZones = false;
  thereAreZones$ = new BehaviorSubject<boolean>(this._thereAreZones);
  private _thereAreLargestZones = false;
  thereAreLargestZones$ = new BehaviorSubject<boolean>(this._thereAreLargestZones);

  constructor(private plantaService: PlantaService, private olMapService: OlMapService) {}

  initService(planta: PlantaInterface): Promise<boolean> {
    return new Promise((initService) => {
      this.plantaService
        .getLocationsArea(planta.id)
        .pipe(take(1))
        .subscribe((locAreas) => {
          this.locAreas = locAreas;
          this.zones = this.getZones(planta, locAreas);
          if (this.zones.length > 0) {
            this.thereAreZones = true;

            this.zonesBySize = this.getCompleteGlobals(this.zones);
            if (this.zonesBySize.length > 1) {
              this.thereAreLargestZones = true;
            }

            this.zones = this.zonesBySize.flat();
          }

          initService(true);
        });
    });
  }

  getZones(planta: PlantaInterface, locAreas: LocationAreaInterface[]): LocationAreaInterface[] {
    // obtenemos las areas descartando las que no tienen globals, que son las de los modulos
    let realLocAreas = locAreas.filter(
      (locArea) =>
        locArea.globalCoords.toString() !== ',' &&
        locArea.globalCoords.toString() !== ',,' &&
        locArea.globalCoords.toString() !== ''
    );

    if (planta.id === 'fjub5AUln6LZER8cQhyw') {
      realLocAreas = this.getZonesByIntersection(realLocAreas);
    }

    if (planta.tipo === 'seguidores') {
      // detectamos la globalCoords mas pequeña que es la utilizaremos para el seguidor
      const indiceSeleccionado = this.getIndexNotNull(realLocAreas);

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

  private getZonesBySize(zones: LocationAreaInterface[]): LocationAreaInterface[][] {
    const indexNotNull = this.getIndexNotNull(zones);
    const zonesBySize = new Array<LocationAreaInterface[]>(indexNotNull + 1);
    for (let index = indexNotNull; index >= 0; index--) {
      let indexZones = zones.filter((zone) => zone.globalCoords[index]);
      if (zonesBySize[index + 1] !== undefined) {
        indexZones = indexZones.filter((zone) => !zonesBySize[index + 1].includes(zone));
      }
      zonesBySize[index] = indexZones;
    }

    return zonesBySize;
  }

  private getZonesByIntersection(zones: LocationAreaInterface[]) {
    const zonasInterseccion: LocationAreaInterface[] = [];

    console.log(zones[0]);

    const zonasMayores = zones.filter((zone) => zone.globalCoords[0] !== null);
    const zonasMenores = zones.filter((zone) => zone.globalCoords[1] !== null);

    zonasMayores.forEach((zonaMayor) => {
      const coordsZonaMayor = this.olMapService.pathToCoordinate(zonaMayor.path);
      coordsZonaMayor.push(coordsZonaMayor[0]);
      const polygonZonaMayor = turf.polygon([coordsZonaMayor]);
      zonasMenores.forEach((zonaMenor) => {
        const coordsZonaMenor = this.olMapService.pathToCoordinate(zonaMenor.path);
        coordsZonaMenor.push(coordsZonaMenor[0]);
        const polygonZonaMenor = turf.polygon([coordsZonaMenor]);

        const intersect = turf.intersect(polygonZonaMayor, polygonZonaMenor);
        if (intersect !== null) {
          const locArea: LocationAreaInterface = {
            globalX: zonaMayor.globalCoords[0],
            globalY: zonaMenor.globalCoords[1],
            globalCoords: [zonaMayor.globalCoords[0], zonaMenor.globalCoords[1]],
            nombreModulo: zonaMayor.nombreModulo,
            potenciaModulo: zonaMayor.potenciaModulo,
            path: this.olMapService.coordinateToPath(turf.getCoords(intersect)),
          };

          zonasInterseccion.push(locArea);
        }
      });
    });

    console.log(zonasInterseccion[0]);

    return zonasInterseccion;
  }

  getIndexNotNull(locAreas: LocationAreaInterface[]): number {
    let indiceSeleccionado;

    const coordsLength = locAreas[0].globalCoords.length;

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

  getCompleteGlobalCoords(zones: LocationAreaInterface[]): LocationAreaInterface[] {
    const largestZones = zones.filter(
      (locArea) =>
        locArea.globalCoords[0] !== undefined && locArea.globalCoords[0] !== null && locArea.globalCoords[0] !== ''
    );

    if (largestZones.length === zones.length) {
      return zones;
    } else {
      // si hay mas de una tamaño de zonas
      const otherZones = zones.filter((zone) => !largestZones.includes(zone));

      otherZones.forEach((zone) => {
        const globalCoordsZone: string[] = zone.globalCoords;
        // calculamos el centroide del seguidor
        const centroid = this.getLocAreaCentroid(zone);

        largestZones.forEach((largestZone) => {
          const polygon = largestZone.path.map((coord) => [coord.lat, coord.lng]);

          // comprobamos si esta dentro de la largestZone
          if (PointInPolygon(centroid, polygon)) {
            largestZone.globalCoords.forEach((coord, i) => {
              if (coord !== null && coord !== undefined && coord !== '') {
                // si la global del otherZone es incorrecta le aplicamos la de la zona mayor
                if (globalCoordsZone[i] === null || globalCoordsZone[i] === undefined || globalCoordsZone[i] === '') {
                  globalCoordsZone[i] = coord;
                }
              }
            });
            zone.globalCoords = globalCoordsZone;
          }
        });
      });

      return [...largestZones, ...otherZones];
    }
  }

  getCompleteGlobals(zones: LocationAreaInterface[]): LocationAreaInterface[][] {
    const zonesBySize = this.getZonesBySize(zones);
    if (zonesBySize.length === 1) {
      return [zones];
    } else if (zonesBySize.length > 1) {
      zonesBySize.forEach((zonesSize, index) => {
        // las mayores ya tienen las globals correctas
        if (index > 0) {
          const zonasMayores = zonesBySize[index - 1];

          zonesSize.forEach((zone) => {
            const globalCoordsZone: string[] = zone.globalCoords;
            // calculamos el centroide de la zona
            const centroid = this.getLocAreaCentroid(zone);

            zonasMayores.forEach((zonaMayor) => {
              const polygon = zonaMayor.path.map((coord) => [coord.lat, coord.lng]);

              // comprobamos si esta dentro de la largestZone
              if (PointInPolygon(centroid, polygon)) {
                zonaMayor.globalCoords.forEach((coord, i) => {
                  if (coord !== null && coord !== undefined && coord !== '') {
                    // si la global del otherZone es incorrecta le aplicamos la de la zona mayor
                    if (
                      globalCoordsZone[i] === null ||
                      globalCoordsZone[i] === undefined ||
                      globalCoordsZone[i] === ''
                    ) {
                      globalCoordsZone[i] = coord;
                    }
                  }
                });
                zone.globalCoords = globalCoordsZone;
              }
            });
          });
        }
      });

      return zonesBySize;
    }
  }

  private getLocAreaCentroid(locArea: LocationAreaInterface): number[] {
    let sumLong = 0;
    let sumLat = 0;
    locArea.path.forEach((coord) => {
      sumLong += coord.lng;
      sumLat += coord.lat;
    });

    return [sumLat / locArea.path.length, sumLong / locArea.path.length];
  }

  resetService() {
    this.locAreas = [];
    this.zones = [];
    this.zonesBySize = [];
    this.thereAreZones = false;
    this.thereAreLargestZones = false;
  }

  get thereAreZones(): boolean {
    return this._thereAreZones;
  }

  set thereAreZones(value: boolean) {
    this._thereAreZones = value;
    this.thereAreZones$.next(value);
  }

  get thereAreLargestZones(): boolean {
    return this._thereAreLargestZones;
  }

  set thereAreLargestZones(value: boolean) {
    this._thereAreLargestZones = value;
    this.thereAreLargestZones$.next(value);
  }
}
