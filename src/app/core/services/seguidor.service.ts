import { Injectable } from '@angular/core';

import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';

import PointInPolygon from 'point-in-polygon';

import { InformeService } from './informe.service';
import { AnomaliaService } from '@core/services/anomalia.service';
import { PlantaService } from '@core/services/planta.service';
import { GLOBAL } from '@core/services/global';

import { Seguidor } from '@core/models/seguidor';
import { PlantaInterface } from '@core/models/planta';
import { LocationAreaInterface } from '@core/models/location';
import { InformeInterface } from '@core/models/informe';
import { Anomalia } from '@core/models/anomalia';
import { PcInterface } from '@core/models/pc';

@Injectable({
  providedIn: 'root',
})
export class SeguidorService {
  private planta: PlantaInterface;
  numGlobalCoords: number;
  public zones: LocationAreaInterface[] = [];
  private locAreaSeguidores: LocationAreaInterface[] = [];
  private locAreaModulos: LocationAreaInterface[] = [];

  constructor(
    private informeService: InformeService,
    public afs: AngularFirestore,
    private storage: AngularFireStorage,
    private anomaliaService: AnomaliaService,
    private plantaService: PlantaService
  ) {}

  getSeguidoresPlanta$(plantaId: string): Observable<Seguidor[]> {
    return this.plantaService
      .getPlanta(plantaId)
      .pipe(
        take(1),
        switchMap((planta) => {
          this.planta = planta;

          this.getDifferentLocAreas(plantaId);

          return this.informeService.getInformesDePlanta(plantaId);
        })
      )
      .pipe(
        take(1),
        switchMap((informes) => {
          const anomaliaObsList = Array<Observable<Seguidor[]>>();
          informes.forEach((informe) => {
            // traemos ambos tipos de anomalias por si hay pcs antiguos
            anomaliaObsList.push(this.getSeguidores$(informe.id, plantaId, 'pcs'));
            anomaliaObsList.push(this.getSeguidores$(informe.id, plantaId, 'anomalias'));
          });
          return combineLatest(anomaliaObsList);
        }),
        map((arr) => arr.flat())
      );
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

          this.locAreaSeguidores.forEach((locArea) => {
            let anomaliasSeguidor: Anomalia[] = [];
            if (sortedAnoms !== null) {
              const anomsLargestLocArea = sortedAnoms[0].find(
                (array) => (array[0] as Anomalia).globalCoords[0] === locArea.globalCoords[0]
              );

              if (anomsLargestLocArea !== undefined) {
                anomaliasSeguidor = anomsLargestLocArea.filter(
                  (anomalia) =>
                    anomalia.globalCoords.slice(0, this.numGlobalCoords).toString() ===
                    locArea.globalCoords.slice(0, this.numGlobalCoords).toString()
                );
              }
            } else {
              anomaliasSeguidor = anomaliaList.filter(
                (anomalia) =>
                  anomalia.globalCoords.slice(0, this.numGlobalCoords).toString() ===
                  locArea.globalCoords.slice(0, this.numGlobalCoords).toString()
              );
            }

            // si no tiene anomalias no creamos el seguidor
            if (anomaliasSeguidor.length > 0) {
              const zona = this.locAreaModulos
                // tslint:disable-next-line: triple-equals
                .find((locA) => locA.globalCoords[0] == locArea.globalCoords[0]);

              let modulo;
              if (zona !== undefined) {
                modulo = zona.modulo;
              } else {
                modulo = anomaliasSeguidor[0].modulo;
                // modulo = this.getSeguidorModule(locAreaList);
              }

              const seguidor = new Seguidor(
                anomaliasSeguidor,
                this.planta.filas,
                this.planta.columnas,
                locArea.path,
                plantaId,
                informeId,
                modulo,
                locArea.globalCoords,
                'seguidor_' + count++ + '_' + informeId
              );
              seguidor.nombre = this.getSeguidorName(seguidor);
              // seguidor.imageName = this.getImageName(seguidor, informe);

              seguidores.push(seguidor);
            }
          });
        }

        return seguidores;
      })
    );
  }

  private getDifferentLocAreas(plantaId: string) {
    this.plantaService.getLocationsArea(plantaId).subscribe((locAreaList) => {
      // guardamos las zonas con módulos
      this.locAreaModulos = locAreaList.filter((locArea) => locArea.modulo !== undefined);

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

          this.numGlobalCoords = indiceSeleccionado + 1;

          break;
        }
      }

      // filtramos las areas seleccionadas para los seguidores
      this.locAreaSeguidores = locAreaList.filter(
        (locArea) =>
          locArea.globalCoords[indiceSeleccionado] !== null &&
          locArea.globalCoords[indiceSeleccionado] !== undefined &&
          locArea.globalCoords[indiceSeleccionado] !== ''
      );

      // obtenemos las areas descartando las que no tienen globals, que son las de los modulos
      const locAreaNoSeguidores = locAreaList
        .filter((locArea) => !this.locAreaSeguidores.includes(locArea))
        .filter((locArea) => locArea.globalCoords.toString() !== ',' && locArea.globalCoords.toString() !== '');

      // asignamos las areas de la planta
      this.zones = locAreaNoSeguidores;

      // obtenemos las globalCoords completas de cada seguidor si hay areas mayores
      if (locAreaNoSeguidores.length > 0) {
        this.locAreaSeguidores.forEach((locArea) => {
          if (locArea.completeGlobalCoords === undefined) {
            locArea.globalCoords = this.getCompleteGlobalCoords(locAreaNoSeguidores, locArea);

            // almacenamos las globalsCoords completas en la DB
            this.plantaService.updateLocationAreaField(locArea, 'completeGlobalCoords', locArea.globalCoords);
          }
        });
      }
    });
  }

  private sortAnomList(anoms: Anomalia[]): any[][] {
    const largestLocAreas = this.zones.filter(
      (locArea) =>
        locArea.globalCoords[0] !== undefined && locArea.globalCoords[0] !== null && locArea.globalCoords[0] !== ''
    );

    if (largestLocAreas.length > 0) {
      const sortAnoms = [[]];
      largestLocAreas.forEach((locArea) => {
        const anomsLocArea = anoms.filter((anom) => anom.globalCoords[0] === locArea.globalCoords[0]);

        sortAnoms[0].push(anomsLocArea);
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
          nombre = nombre + this.plantaService.getGlobalsConector() + coord;
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
      // convertimos el punto y el poligono en array
      const point = [locAreaSeguidor.path[0].lat, locAreaSeguidor.path[0].lng];
      const polygon = locAreaNoSeg.path.map((coord) => [coord.lat, coord.lng]);

      if (PointInPolygon(point, polygon)) {
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

  getPerdidasAnomColor(anomalia: Anomalia) {
    if (anomalia.perdidas < 0.33) {
      return GLOBAL.colores_mae[0];
    } else if (anomalia.perdidas < 0.66) {
      return GLOBAL.colores_mae[1];
    } else {
      return GLOBAL.colores_mae[2];
    }
  }

  getCelsCalientesAnomColor(anomalia: Anomalia) {
    return 'red';
  }

  getGradienteAnomColor(anomalia: Anomalia) {
    if (anomalia.gradienteNormalizado < 10) {
      return GLOBAL.colores_grad[0];
    } else if (anomalia.gradienteNormalizado < 40) {
      return GLOBAL.colores_grad[1];
    } else {
      return GLOBAL.colores_grad[2];
    }
  }
}
