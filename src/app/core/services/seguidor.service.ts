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

@Injectable({
  providedIn: 'root',
})
export class SeguidorService {
  private planta: PlantaInterface;
  numGlobalCoords: number;
  private _locAreas: LocationAreaInterface[] = [];
  locAreas$ = new BehaviorSubject<LocationAreaInterface[]>(this._locAreas);

  minGradNorm: number;
  maxGradNorm: number;

  constructor(
    private informeService: InformeService,
    public afs: AngularFirestore,
    private storage: AngularFireStorage,
    private anomaliaService: AnomaliaService,
    private plantaService: PlantaService
  ) {}

  getSeguidoresPlanta$(plantaId: string): Observable<Seguidor[]> {
    return this.informeService.getInformesDePlanta(plantaId).pipe(
      take(1),
      switchMap((informes) => {
        this.plantaService.getPlanta(plantaId).subscribe((planta) => (this.planta = planta));
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
    // Obtener todas las locArea de la planta
    const locAreaList$ = this.plantaService.getLocationsArea(plantaId);
    const anomaliaList$ = this.anomaliaService.getAnomalias$(informeId, tipo);
    const getInforme$ = this.informeService.getInforme(informeId);

    // obtenemos todas las anomalias y las locAreas
    return combineLatest([locAreaList$, anomaliaList$, getInforme$]).pipe(
      map(([locAreaList, anomaliaList, informe]) => {
        const seguidores: Seguidor[] = [];

        this.getMinMaxGradNorm(anomaliaList);

        if (anomaliaList.length > 0) {
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
          const locAreaSeguidores = locAreaList.filter(
            (locArea) =>
              locArea.globalCoords[indiceSeleccionado] !== null &&
              locArea.globalCoords[indiceSeleccionado] !== undefined &&
              locArea.globalCoords[indiceSeleccionado] !== ''
          );

          // obtenemos las areas descartando las que no tienen globals, que son las de los modulos
          const locAreaNoSeguidores = locAreaList
            .filter((locArea) => !locAreaSeguidores.includes(locArea))
            .filter((locArea) => locArea.globalCoords.toString() !== ',' && locArea.globalCoords.toString() !== '');

          // asignamos las areas de la planta
          this.locAreas = locAreaNoSeguidores;

          // obtenemos las globalCoords completas de cada seguidor si hay areas mayores
          if (locAreaNoSeguidores.length > 0) {
            locAreaSeguidores.forEach((locArea) => {
              locArea.globalCoords = this.getCompleteGlobalCoords(locAreaNoSeguidores, locArea);
            });
          }

          // detectamos que anomalias estan dentro de cada locArea y creamos cada seguidor
          let count = 0;
          locAreaSeguidores.forEach((locArea) => {
            const anomaliasSeguidor = anomaliaList.filter(
              (anomalia) =>
                anomalia.globalCoords.slice(0, this.numGlobalCoords).toString() ===
                locArea.globalCoords.slice(0, this.numGlobalCoords).toString()
            );

            // si no tiene anomalias no creamos el seguidor
            if (anomaliasSeguidor.length > 0) {
              const zona = locAreaList
                .filter((locA) => locA.modulo !== undefined)
                // tslint:disable-next-line: triple-equals
                .find((locA) => locA.globalCoords[0] == locArea.globalCoords[0]);

              let modulo;
              if (zona !== undefined) {
                modulo = zona.modulo;
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
              seguidor.imageName = this.getImageName(seguidor, informe);

              seguidores.push(seguidor);
            }
          });
        }

        return seguidores;
      })
    );
  }

  private getSeguidorName(seguidor: Seguidor): string {
    let nombre = 'Seguidor ';
    seguidor.globalCoords.forEach((coord, index) => {
      if (index === 0) {
        nombre = nombre + coord;
      } else {
        if (coord !== null && coord !== undefined && coord !== '') {
          nombre = nombre + GLOBAL.stringConectorGlobalsDefault + coord;
        }
      }
    });

    return nombre;
  }

  private getCompleteGlobalCoords(
    locAreasNoSeguidores: LocationAreaInterface[],
    locAreaSeguidor: LocationAreaInterface
  ): string[] {
    const globalCoords: string[] = locAreaSeguidor.globalCoords;

    locAreasNoSeguidores.forEach((locArea, index) => {
      // convertimos el punto y el poligono en array
      const point = [locAreaSeguidor.path[0].lat, locAreaSeguidor.path[0].lng];
      const polygon = locArea.path.map((coord) => [coord.lat, coord.lng]);

      if (PointInPolygon(point, polygon)) {
        locArea.globalCoords.forEach((gC, i) => {
          if (gC !== null) {
            if (globalCoords[i] !== null || globalCoords[i] !== undefined || globalCoords[i] !== '') {
              globalCoords[i] = gC;
            }
          }
        });
      }
    });

    return globalCoords;
  }

  private getImageName(seguidor: Seguidor, informe: InformeInterface): string {
    const anomalia = seguidor.anomalias[0];
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

  downloadImage(folder: string, seguidor: Seguidor) {
    this.storage
      .ref(`informes/${seguidor.informeId}/${folder}/${seguidor.imageName}`)
      .getDownloadURL()
      .subscribe((downloadUrl) => {
        // (anomalia as PcInterface).downloadUrlStringRjpg = downloadUrl;
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = (event) => {
          /* Create a new Blob object using the response
           *  data of the onload object.
           */
          const blob = new Blob([xhr.response], { type: 'image/jpg' });
          const a: any = document.createElement('a');
          a.style = 'display: none';
          document.body.appendChild(a);
          const url = window.URL.createObjectURL(blob);
          a.href = url;
          a.download = `radiometrico_${seguidor.imageName}`;
          a.click();
          window.URL.revokeObjectURL(url);
        };
        xhr.open('GET', downloadUrl);
        xhr.send();
      });
  }

  private getMinMaxGradNorm(anomalias: Anomalia[]) {
    // filtramos solo las que tengan gradiente normalizado
    const anomsOk = anomalias.filter((anom) => anom.gradienteNormalizado !== undefined);

    if (anomsOk.length > 0) {
      const minGrad = Math.min(...anomsOk.map((anom) => anom.gradienteNormalizado));
      const maxGrad = Math.max(...anomsOk.map((anom) => anom.gradienteNormalizado));

      if (this.minGradNorm === undefined) {
        this.minGradNorm = minGrad;
      } else if (this.minGradNorm > minGrad) {
        this.minGradNorm = minGrad;
      }

      if (this.maxGradNorm === undefined) {
        this.maxGradNorm = maxGrad;
      } else if (this.maxGradNorm < maxGrad) {
        this.maxGradNorm = maxGrad;
      }
    }
  }

  getPerdidasColor(anomaliaSelected: Anomalia) {
    if (anomaliaSelected.perdidas <= 0.33) {
      return GLOBAL.colores_mae[0];
    } else if (anomaliaSelected.perdidas > 0.66) {
      return GLOBAL.colores_mae[1];
    } else {
      return GLOBAL.colores_mae[2];
    }
  }

  getCelsCalientesColor(anomaliaSelected: Anomalia) {
    return 'red';
  }

  getGradienteColor(anomaliaSelected: Anomalia) {
    if (anomaliaSelected.gradienteNormalizado <= (this.maxGradNorm - this.minGradNorm) / 3) {
      return GLOBAL.colores_mae[0];
    } else if (anomaliaSelected.gradienteNormalizado <= (2 * (this.maxGradNorm - this.minGradNorm)) / 3) {
      return GLOBAL.colores_mae[1];
    } else {
      return GLOBAL.colores_mae[2];
    }
  }

  get locAreas() {
    return this._locAreas;
  }

  set locAreas(value: LocationAreaInterface[]) {
    this._locAreas = value;
    this.locAreas$.next(value);
  }
}
