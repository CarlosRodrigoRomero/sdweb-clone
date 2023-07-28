import { Injectable } from '@angular/core';

import { combineLatest, Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import { AngularFirestore } from '@angular/fire/firestore';

import PointInPolygon from 'point-in-polygon';

import { AnomaliaService } from '@data/services/anomalia.service';
import { ZonesService } from './zones.service';
import { AnomaliaInfoService } from './anomalia-info.service';

import { Seguidor } from '@core/models/seguidor';
import { PlantaInterface } from '@core/models/planta';
import { LocationAreaInterface } from '@core/models/location';
import { InformeInterface } from '@core/models/informe';
import { Anomalia } from '@core/models/anomalia';

import { COLOR } from '@data/constants/color';
import { TipoSeguidor } from '@core/models/tipoSeguidor';
import { PcInterface } from '@core/models/pc';
import { Colors } from '@core/classes/colors';
import { GLOBAL } from '@data/constants/global';

@Injectable({
  providedIn: 'root',
})
export class SeguidorService {
  planta: PlantaInterface;
  numGlobalCoords: number;
  public zones: LocationAreaInterface[] = [];
  private locAreaSeguidores: LocationAreaInterface[] = [];
  private locAreasModulo: LocationAreaInterface[] = [];
  private locAreasTipoSeguidor: LocationAreaInterface[] = [];

  constructor(
    public afs: AngularFirestore,
    private anomaliaService: AnomaliaService,
    private zonesService: ZonesService,
    private anomaliaInfoService: AnomaliaInfoService
  ) {}

  getSeguidoresPlanta$(planta: PlantaInterface, informes: InformeInterface[]): Observable<Seguidor[]> {
    this.planta = planta;
    this.getDifferentLocAreas();

    const anomaliaObsList = informes.map((informe) => {
      const type =
        informe.fecha > GLOBAL.dateS2eAnomalias ? 'anomalias' : this.planta.tipo === 'seguidores' ? 'pcs' : 'anomalias';

      return this.getSeguidores$(informe.id, planta.id, type);
    });

    return combineLatest(anomaliaObsList).pipe(map((arr) => arr.flat()));
  }

  getSeguidores$(informeId: string, plantaId: string, tipo?: 'anomalias' | 'pcs'): Observable<Seguidor[]> {
    // obtenemos todas las anomalias y las locAreas
    return this.anomaliaService.getAnomalias$(informeId, tipo).pipe(
      take(1),
      map((anomaliaList) => {
        const seguidores: Seguidor[] = [];

        if (anomaliaList.length > 0) {
          let sortedAnoms: any[][];

          // comprobamos si hay zonas
          if (this.zones.length > 0) {
            // ordenamos las anomalias por zonas
            sortedAnoms = this.sortAnomList(anomaliaList);
          } else {
            sortedAnoms = null;
          }

          // detectamos que anomalias estan dentro de cada locArea y creamos cada seguidor
          let count = 0;

          this.locAreaSeguidores.forEach((areaSeg) => {
            let anomaliasSeguidor: Anomalia[] = [];
            if (sortedAnoms !== null) {
              const anomsLargestLocArea = sortedAnoms[0].find(
                (array) => (array[0] as Anomalia).globalCoords[0] == areaSeg.globalCoords[0]
              );

              if (anomsLargestLocArea !== undefined) {
                anomaliasSeguidor = anomsLargestLocArea.filter(
                  (anomalia) =>
                    anomalia.globalCoords.slice(0, this.numGlobalCoords).toString() ===
                    areaSeg.globalCoords.slice(0, this.numGlobalCoords).toString()
                );
              }
            } else {
              anomaliasSeguidor = anomaliaList.filter(
                (anomalia) =>
                  anomalia.globalCoords.slice(0, this.numGlobalCoords).toString() ===
                  areaSeg.globalCoords.slice(0, this.numGlobalCoords).toString()
              );
            }

            // si no tiene anomalias no creamos el seguidor
            if (anomaliasSeguidor.length > 0) {
              // ordenamos las anomalias por tipo
              anomaliasSeguidor = this.anomaliaService.sortAnomsByTipo(anomaliasSeguidor);

              const zonaModulo = this.locAreasModulo
                // tslint:disable-next-line: triple-equals
                .find((locA) => locA.globalCoords[0] == areaSeg.globalCoords[0]);

              let modulo = null;
              if (zonaModulo !== undefined) {
                modulo = zonaModulo.modulo;
              } else {
                const anomaliaConModulo = anomaliasSeguidor.find(
                  (anom) => anom.modulo !== null && anom.modulo !== undefined
                );
                if (anomaliaConModulo !== undefined) {
                  modulo = anomaliaConModulo.modulo;
                }
                // modulo = this.getSeguidorModule(locAreaList);
              }

              const zonaTipoSeguidor = this.getZonaTipoSeguidor(areaSeg);
              let tipoSeguidor: TipoSeguidor;
              if (zonaTipoSeguidor !== undefined) {
                tipoSeguidor = zonaTipoSeguidor.tipoSeguidor;
                anomaliasSeguidor.map((anom) => {
                  anom.tipoSeguidor = tipoSeguidor;
                  return anom;
                });
              }

              const seguidor = new Seguidor(
                anomaliasSeguidor,
                this.planta.filas,
                this.planta.columnas,
                areaSeg.path,
                plantaId,
                informeId,
                modulo,
                areaSeg.globalCoords,
                'seguidor_' + count++ + '_' + informeId
              );
              seguidor.nombre = this.getSeguidorName(seguidor);

              // guardamos el nombre del seguidor en cada anomalia
              anomaliasSeguidor.forEach((anom) => (anom.nombreSeguidor = seguidor.nombre));

              seguidores.push(seguidor);
            }
          });
        }

        return seguidores;
      })
    );
  }

  private getDifferentLocAreas() {
    const locAreas = this.zonesService.locAreas;
    this.locAreaSeguidores = this.zonesService.locAreaSeguidores;
    this.zones = this.zonesService.zones;

    // guardamos las zonas con módulos
    this.locAreasModulo = locAreas.filter((locArea) => locArea.modulo !== undefined);

    // guardamos las zonas con tipoSeguidor
    this.locAreasTipoSeguidor = locAreas.filter((locArea) => locArea.tipoSeguidor !== undefined);

    // detectamos la globalCoords mas pequeña que es la utilizaremos para el seguidor
    const indiceSeleccionado = this.zonesService.getIndexNotNull(locAreas);
    this.numGlobalCoords = indiceSeleccionado + 1;

    // obtenemos las globalCoords completas de cada seguidor si hay areas mayores
    if (this.zones.length > 0) {
      this.locAreaSeguidores.forEach((locArea) => {
        locArea.globalCoords = this.getCompleteGlobalCoords(this.zones, locArea);
      });
    }
  }

  private getZonaTipoSeguidor(zonaSeg: LocationAreaInterface) {
    const zonaTipoSeguidor = this.locAreasTipoSeguidor.find((locA) =>
      this.zonesService.isZoneInsideLargestZone(zonaSeg, locA)
    );

    return zonaTipoSeguidor;
  }

  private sortAnomList(anoms: Anomalia[]): any[][] {
    const largestLocAreas = this.zones.filter(
      (locArea) =>
        locArea.globalCoords[0] !== undefined && locArea.globalCoords[0] !== null && locArea.globalCoords[0] !== ''
    );

    if (largestLocAreas.length > 0) {
      const sortAnoms = [[]];
      largestLocAreas.forEach((locArea) => {
        const anomsLocArea = anoms.filter((anom) => anom.globalCoords[0] == locArea.globalCoords[0]);

        if (anomsLocArea.length > 0) {
          sortAnoms[0].push(anomsLocArea);
        }
      });

      return sortAnoms;
    } else {
      return null;
    }
  }

  private getSeguidorName(seguidor: Seguidor): string {
    let nombre = '';
    seguidor.globalCoords.forEach((coord, index) => {
      if (index === 0) {
        nombre = nombre + coord;
      } else {
        if (coord !== null && coord !== undefined && coord !== '') {
          nombre = nombre + this.anomaliaInfoService.getGlobalsConector(this.planta) + coord;
        }
      }
    });

    return nombre;
  }

  private getSeguidorModule(locAreas: LocationAreaInterface[]) {
    const locAreasWithModule = locAreas.filter((locArea) => locArea.modulo !== undefined);
  }

  private getCompleteGlobalCoords(
    locAreasNoSeguidores: LocationAreaInterface[],
    locAreaSeguidor: LocationAreaInterface
  ): string[] {
    const globalCoordsSeguidor: string[] = locAreaSeguidor.globalCoords;

    locAreasNoSeguidores.forEach((locAreaNoSeg) => {
      // calculamos el centroide del seguidor
      const centroid = this.getLocAreaCentroid(locAreaSeguidor);

      const polygon = locAreaNoSeg.path.map((coord) => [coord.lat, coord.lng]);

      // comprobamos si esta dentro de la zona
      if (PointInPolygon(centroid, polygon)) {
        locAreaNoSeg.globalCoords.forEach((coord, i) => {
          if (coord !== null && coord !== undefined && coord !== '') {
            // si la global del seguidor es incorrecta le aplicamos la del area
            if (
              globalCoordsSeguidor[i] === null ||
              globalCoordsSeguidor[i] === undefined ||
              globalCoordsSeguidor[i] === ''
            ) {
              globalCoordsSeguidor[i] = coord;
            }
          }
        });
      }
    });

    // globalCoordsSeguidor.filter((coord) => coord !== null);

    return globalCoordsSeguidor.filter((coord) => coord !== null);
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

  private getImageName(seguidor: Seguidor, informe: InformeInterface): string {
    let anomalia;
    if (seguidor.anomaliasCliente.length > 0) {
      anomalia = seguidor.anomaliasCliente[0];
    } else {
      anomalia = seguidor.anomalias[0];
    }

    if (anomalia !== undefined) {
      let imageName: string;

      imageName = informe.prefijo;

      anomalia.globalCoords.forEach((coord) => {
        if (coord !== null) {
          imageName = imageName + coord + '.';
        }
      });

      imageName = imageName + anomalia.localX + '.' + anomalia.localY + '.jpg';

      return imageName;
    }
  }

  getNombreSeguidor(pc: PcInterface) {
    let nombreSeguidor = '';
    if (pc.hasOwnProperty('global_x')) {
      if (!Number.isNaN(pc.global_x) && pc.global_x !== null) {
        nombreSeguidor = nombreSeguidor.concat(pc.global_x.toString());
      }
    }
    if (pc.hasOwnProperty('global_y')) {
      if (!Number.isNaN(pc.global_y) && pc.global_y !== null) {
        if (nombreSeguidor.length > 0) {
          nombreSeguidor = nombreSeguidor.concat(this.anomaliaInfoService.getGlobalsConector(this.planta));
        }
        nombreSeguidor = nombreSeguidor.concat(pc.global_y.toString());
      }
    }
    if (pc.hasOwnProperty('global_z')) {
      if (!Number.isNaN(pc.global_z) && pc.global_z !== null) {
        if (nombreSeguidor.length > 0) {
          nombreSeguidor = nombreSeguidor.concat(this.anomaliaInfoService.getGlobalsConector(this.planta));
        }
        nombreSeguidor = nombreSeguidor.concat(pc.global_z.toString());
      }
    }
    return nombreSeguidor;
  }

  getPerdidasAnomColor(anomalia: Anomalia) {
    if (anomalia.perdidas < 0.33) {
      return COLOR.colores_severity[0];
    } else if (anomalia.perdidas < 0.66) {
      return COLOR.colores_severity[1];
    } else {
      return COLOR.colores_severity[2];
    }
  }

  getCelsCalientesAnomColor(anomalia: Anomalia) {
    if (anomalia.gradienteNormalizado < 10) {
      return COLOR.colores_severity[0];
    } else if (anomalia.gradienteNormalizado < 40) {
      return COLOR.colores_severity[1];
    } else {
      return COLOR.colores_severity[2];
    }
  }

  getGradienteAnomColor(anomalia: Anomalia) {
    if (anomalia.gradienteNormalizado < 10) {
      return COLOR.colores_severity[0];
    } else if (anomalia.gradienteNormalizado < 40) {
      return COLOR.colores_severity[1];
    } else {
      return COLOR.colores_severity[2];
    }
  }

  getTipoAnomColor(anomalia: Anomalia) {
    const colorRGBA = COLOR.colores_tipos[anomalia.tipo];
    const colorRGB = colorRGBA.replace('rgba', 'rgb').replace(',1)', ')');
    const colorHex = Colors.rgbToHex(colorRGB);
    return colorHex;
  }
}
