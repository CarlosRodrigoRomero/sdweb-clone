import { Injectable } from '@angular/core';

import { combineLatest, Observable } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';

import { AngularFirestore } from '@angular/fire/firestore';

import { InformeService } from './informe.service';
import { AnomaliaService } from '@core/services/anomalia.service';
import { PlantaService } from '@core/services/planta.service';
import { GLOBAL } from '@core/services/global';

import { Seguidor } from '@core/models/seguidor';
import { PlantaInterface } from '@core/models/planta';
import { PcInterface } from '@core/models/pc';
import { LocationAreaInterface } from '@core/models/location';

@Injectable({
  providedIn: 'root',
})
export class SeguidorService {
  private planta: PlantaInterface;

  constructor(
    private informeService: InformeService,
    public afs: AngularFirestore,
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
      map((arr) => arr.flat()),
      // eliminamos los seguidores vacios por haber llamado a 'pcs' y 'anomalias'
      map((segs) => (segs = segs.filter((seg) => seg.temperaturaMax !== 0 || seg.gradienteNormalizado !== 0)))
    );
  }

  getSeguidores$(informeId: string, plantaId: string, tipo?: 'anomalias' | 'pcs'): Observable<Seguidor[]> {
    // Obtener todas las locArea de la planta
    const locAreaList$ = this.plantaService.getLocationsArea(plantaId);
    const anomaliaList$ = this.anomaliaService.getAnomalias$(informeId, tipo);

    // obtenemos todas las anomalias y las locAreas
    return combineLatest([locAreaList$, anomaliaList$]).pipe(
      take(1),
      map(([locAreaList, anomaliaList]) => {
        const seguidores: Seguidor[] = [];

        // comprobamos si tiene globalCoords o globaX, globalY
        if (locAreaList.filter((locArea) => locArea.globalCoords !== undefined).length > 0) {
          // si tiene globalCoords detectamos la mas pequeña que es la utilizaremos para el seguidor
          const contador = [1, 2];
          let indiceSeleccionado = 0;
          contador.forEach((c) => {
            const numItems = locAreaList.filter((locArea) => locArea.globalCoords[c] !== null).length;
            if (numItems > 0) {
              indiceSeleccionado = c;
            }
          });
          // filtramos las areas seleccionadas para los seguidores
          const locAreaSeguidores = locAreaList.filter((locArea) => locArea.globalCoords[indiceSeleccionado] !== null);

          // detectamos que anomalias estan dentro de cada locArea y creamos cada seguidor
          let count = 0;
          locAreaSeguidores.forEach((locArea) => {
            const anomaliasSeguidor = anomaliaList.filter(
              (anomalia) => anomalia.globalCoords[indiceSeleccionado] === locArea.globalCoords[indiceSeleccionado]
            );
            const seguidor = new Seguidor(
              anomaliasSeguidor,
              this.planta.filas,
              this.planta.columnas,
              locArea.path,
              plantaId,
              informeId,
              locArea.modulo,
              locArea.globalCoords,
              'seguidor_' + count++ + '_' + informeId
            );
            seguidor.nombre = this.getSeguidorName(seguidor);

            seguidores.push(seguidor);
          });
        } else {
          // aqui estan las que no tienen globalCoords
          // filtramos las areas para los seguidores eligiendo las más pequeños como seguidores
          let locAreaSeguidores: LocationAreaInterface[] = [];
          if (locAreaList.filter((locArea) => locArea.globalZ !== undefined && locArea.globalZ !== '').length > 0) {
            locAreaSeguidores = locAreaList.filter((locArea) => locArea.globalZ !== '');

            // detectamos que anomalias estan dentro de cada locArea y creamos cada seguidor
            let count = 0;
            locAreaSeguidores.forEach((locArea) => {
              let anomaliasSeguidor = anomaliaList
                .filter((anomalia) => anomalia.globalCoords !== undefined)
                .filter((anomalia) => anomalia.globalCoords[2] == locArea.globalZ);

              // comprovamos si las anomalias son de tipo 'anomalia' o 'pc'
              if (anomaliasSeguidor.length === 0) {
                anomaliasSeguidor = anomaliaList.filter(
                  (anomalia) => (anomalia as PcInterface).global_z === locArea.globalZ
                );
              }

              const seguidor = new Seguidor(
                anomaliasSeguidor,
                this.planta.filas,
                this.planta.columnas,
                locArea.path,
                plantaId,
                informeId,
                locArea.modulo,
                [locArea.globalX, locArea.globalY, locArea.globalZ],
                'seguidor_' + count++ + '_' + informeId
              );
              seguidor.nombre = this.getSeguidorName(seguidor);

              seguidores.push(seguidor);
            });
          } else if (
            locAreaList.filter((locArea) => locArea.globalY !== undefined && locArea.globalY !== '').length > 0
          ) {
            locAreaSeguidores = locAreaList.filter((locArea) => locArea.globalY !== '');

            // detectamos que anomalias estan dentro de cada locArea y creamos cada seguidor
            let count = 0;
            locAreaSeguidores.forEach((locArea) => {
              let anomaliasSeguidor = anomaliaList
                .filter((anomalia) => anomalia.globalCoords !== undefined)
                .filter((anomalia) => anomalia.globalCoords[1] == locArea.globalY);

              // comprovamos si las anomalias son de tipo 'anomalia' o 'pc'
              if (anomaliasSeguidor.length === 0) {
                anomaliasSeguidor = anomaliaList.filter(
                  (anomalia) => (anomalia as PcInterface).global_y === locArea.globalY
                );
              }

              const seguidor = new Seguidor(
                anomaliasSeguidor,
                this.planta.filas,
                this.planta.columnas,
                locArea.path,
                plantaId,
                informeId,
                locArea.modulo,
                [locArea.globalX, locArea.globalY, null],
                'seguidor_' + count++ + '_' + informeId
              );
              seguidor.nombre = this.getSeguidorName(seguidor);

              seguidores.push(seguidor);
            });
          } else {
            locAreaSeguidores = locAreaList.filter((locArea) => locArea.globalX !== '');

            // detectamos que anomalias estan dentro de cada locArea y creamos cada seguidor
            let count = 0;
            locAreaSeguidores.forEach((locArea) => {
              let anomaliasSeguidor = anomaliaList
                .filter((anomalia) => anomalia.globalCoords !== undefined)
                .filter((anomalia) => anomalia.globalCoords[0] == locArea.globalX);

              // comprovamos si las anomalias son de tipo 'anomalia' o 'pc'
              if (anomaliasSeguidor.length === 0) {
                anomaliasSeguidor = anomaliaList.filter(
                  (anomalia) => (anomalia as PcInterface).global_x === locArea.globalX
                );
              }

              const seguidor = new Seguidor(
                anomaliasSeguidor,
                this.planta.filas,
                this.planta.columnas,
                locArea.path,
                plantaId,
                informeId,
                locArea.modulo,
                [locArea.globalX, null, null],
                'seguidor_' + count++ + '_' + informeId
              );
              seguidor.nombre = this.getSeguidorName(seguidor);

              seguidores.push(seguidor);
            });
          }
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
        if (coord !== null) {
          nombre = nombre + GLOBAL.stringConectorGlobalsDefault + coord;
        }
      }
    });

    return nombre;
  }
}
