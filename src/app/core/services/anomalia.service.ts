import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Anomalia } from '../models/anomalia';
import { GLOBAL } from './global';

@Injectable({
  providedIn: 'root',
})
export class AnomaliaService {
  private _selectedInformeId: string;
  public allAnomaliasInforme: Anomalia[];
  constructor(public afs: AngularFirestore) {}

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
    const anomaliaObj = this.prepararParaDb(anomalia);
    return this.afs.collection('pcs').doc(id).set(anomaliaObj);
  }
  getAnomalias$(informeId: string): Observable<Anomalia[]> {
    const query$ = this.afs
      .collection<Anomalia>('pcs', (ref) => ref.where('informeId', '==', informeId))
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
    const anomaliaObj = this.prepararParaDb(anomalia);
    return this.afs.doc('pcs/' + anomalia.id).update(anomaliaObj);
  }

  private prepararParaDb(anomalia: Anomalia) {
    anomalia.featureCoords = { ...anomalia.featureCoords };
    return Object.assign({}, anomalia);
  }

  getLabelsTipoPcs(): string[] {
    const indices: number[] = [];
    const labels: string[] = [];
    this.allAnomaliasInforme.forEach((pc) => {
      if (!indices.includes(pc.tipo)) {
        indices.push(pc.tipo);
      }
    });
    indices.forEach((i) => labels.push(GLOBAL.labels_tipos[i]));
    // los ordena como estan en GLOBAL
    labels.sort((a, b) => GLOBAL.labels_tipos.indexOf(a) - GLOBAL.labels_tipos.indexOf(b));

    return labels;
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
