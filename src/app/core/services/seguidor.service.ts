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
  numGlobalCoords: number;

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

            this.numGlobalCoords = indiceSeleccionado;

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
