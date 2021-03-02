import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { combineLatest, Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import { AngularFirestore } from '@angular/fire/firestore';

import { InformeService } from './informe.service';
import { AnomaliaService } from '@core/services/anomalia.service';
import { PlantaService } from '@core/services/planta.service';

import { Seguidor } from '@core/models/seguidor';
import { PlantaInterface } from '@core/models/planta';
import { Anomalia } from '@core/models/anomalia';
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
    private plantaService: PlantaService,
    private activatedRoute: ActivatedRoute
  ) {}

  getSeguidoresPlanta$(plantaId: string): Observable<Seguidor[]> {
    return this.informeService.getInformesDePlanta(plantaId).pipe(
      take(1),
      switchMap((informes) => {
        this.plantaService.getPlanta(plantaId).subscribe((planta) => (this.planta = planta));
        const anomaliaObsList = Array<Observable<Seguidor[]>>();
        informes.forEach((informe) => {
          anomaliaObsList.push(this.getSeguidores$(informe.id, plantaId, 'pcs'));
        });
        return combineLatest(anomaliaObsList);
      }),
      map((arr) => {
        return arr.flat();
      })
    );
  }

  getSeguidores$(informeId: string, plantaId: string, tipo?: 'anomalias' | 'pcs'): Observable<Seguidor[]> {
    // Obtener todas las locArea de la planta
    const locAreaList$ = this.plantaService.getLocationsArea(plantaId).pipe(take(1));
    const anomaliaList$ = this.anomaliaService.getAnomalias$(informeId, tipo).pipe(take(1));

    // obtenemos todas las anomalias y las locAreas
    return combineLatest([locAreaList$, anomaliaList$]).pipe(
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
          locAreaSeguidores.forEach((locArea) => {
            const anomaliasSeguidor = anomaliaList.filter(
              (anomalia) => anomalia.globalCoords[indiceSeleccionado] === locArea.globalCoords[indiceSeleccionado]
            );
            const seguidor = new Seguidor(
              anomaliasSeguidor,
              this.planta.filas,
              this.planta.columnas,
              locArea.path,
              plantaId
            );
            seguidores.push(seguidor);
          });
        } else {
          // filtramos las areas seleccionadas para los seguidores
          const locAreaSeguidores = locAreaList.filter((locArea) => locArea.globalX !== null);

          // detectamos que anomalias estan dentro de cada locArea y creamos cada seguidor
          locAreaSeguidores.forEach((locArea) => {
            const anomaliasSeguidor = anomaliaList.filter(
              (anomalia) => (anomalia as PcInterface).global_x === locArea.globalX
            );
            // comprobamos que haya anomalías dentro del seguidor
            if (anomaliasSeguidor.length > 0) {
              const seguidor = new Seguidor(
                anomaliasSeguidor,
                this.planta.filas,
                this.planta.columnas,
                locArea.path,
                plantaId
              );
              seguidores.push(seguidor);
            }
          });
        }

        return seguidores;
      })
    );
  }
}
