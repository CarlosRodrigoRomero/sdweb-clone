import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable, combineLatest } from 'rxjs';
import { map, take, switchMap } from 'rxjs/operators';
import { Anomalia } from '../models/anomalia';
import { InformeService } from './informe.service';

@Injectable({
  providedIn: 'root',
})
export class AnomaliaService {
  private _selectedInformeId: string;
  public allAnomaliasInforme: Anomalia[];
  constructor(public afs: AngularFirestore, private informeService: InformeService) {}

  set selectedInformeId(informeId: string) {
    this._selectedInformeId = informeId;
    this.getAnomalias$(informeId)
      .pipe(take(1))
      .subscribe((anoms) => {
        this.allAnomaliasInforme = anoms;
      });
  }
  get selectedInformeId(): string {
    return this._selectedInformeId;
  }

  async addAnomalia(anomalia: Anomalia) {
    const id = this.afs.createId();
    anomalia.id = id;
    // Para que Firestore admita "featureCoords", lo transformamos en un objeto
    const anomaliaObj = this._prepararParaDb(anomalia);
    return this.afs.collection('anomalias').doc(id).set(anomaliaObj);
  }
  getAnomaliasPlanta$(plantaId: string): Observable<Anomalia[]> {
    const query$ = this.informeService.getInformesDePlanta(plantaId).pipe(
      take(1),
      switchMap((informes) => {
        const anomaliaObsList = Array<Observable<Anomalia[]>>();
        informes.forEach((informe) => {
          anomaliaObsList.push(this.getAnomalias$(informe.id));
        });
        return combineLatest(anomaliaObsList);
      }),
      map((arr) => {
        return arr.flat();
      })
    );

    return query$;
  }

  getAnomalias$(informeId: string, tipo: 'anomalias' | 'pcs' = 'anomalias'): Observable<Anomalia[]> {
    const query$ = this.afs
      .collection<Anomalia>(tipo, (ref) => ref.where('informeId', '==', informeId))
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((doc) => {
            let data = doc.payload.doc.data() as Anomalia;
            data.id = doc.payload.doc.id;
            // Convertimos el objetjo en un array
            if (data.hasOwnProperty('featureCoords')) {
              data.featureCoords = Object.values(data.featureCoords);
            }

            return data;
          })
        )
      );
    return query$;
  }
  async updateAnomalia(anomalia: Anomalia) {
    const anomaliaObj = this._prepararParaDb(anomalia);
    const anomaliaDoc = this.afs.doc('anomalias/' + anomalia.id);
    return anomaliaDoc.set(anomaliaObj);
  }

  private _prepararParaDb(anomalia: Anomalia) {
    anomalia.featureCoords = { ...anomalia.featureCoords };
    anomalia.globalCoords = { ...anomalia.globalCoords };
    const tipo: any = anomalia.tipo;
    anomalia.tipo = parseInt(tipo);
    return Object.assign({}, anomalia);
  }

  // getTempMaxAll(): number {
  // const tMax = Math.max(
  //   ...this.allAnomalias.map((pc) => {
  //     return pc.temperaturaMax as number;
  //   })
  // );
  // return Math.ceil(tMax);
  // }
}
