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
          anomaliaObsList.push(this.getSeguidores$(informe.id, 'pcs'));
        });
        return combineLatest(anomaliaObsList);
      }),
      map((arr) => {
        return arr.flat();
      })
    );
  }

  getSeguidores$(informeId: string, tipo?: 'anomalias' | 'pcs'): Observable<Seguidor[]> {
    return this.anomaliaService.getAnomalias$(informeId, tipo).pipe(
      take(1),
      map((anomalias) => {
        const coordSeguidores = [
          ...new Set(
            anomalias.map((anomalia) => (anomalia as PcInterface).global_x).filter((coords) => coords !== undefined)
          ),
        ];
        const seguidores: Seguidor[] = [];
        coordSeguidores.forEach((coords) => {
          const anomaliasSeguidor: Anomalia[] = anomalias.filter(
            (anomalia) => (anomalia as PcInterface).global_x === coords
          );
          this.getLocAreaBySeguidor(coords).subscribe((locArea) => {
            const seguidor = new Seguidor(anomaliasSeguidor, this.planta.filas, this.planta.columnas, locArea);
            seguidores.push(seguidor);
          });
        });
        return seguidores;
      })
    );
  }

  getLocAreaBySeguidor(coords: any): Observable<LocationAreaInterface> {
    return this.plantaService.getLocationsArea(this.planta.id).pipe(
      take(1),
      map((locAreas) => locAreas.find((locA) => locA.globalX === coords))
    );
  }
}
