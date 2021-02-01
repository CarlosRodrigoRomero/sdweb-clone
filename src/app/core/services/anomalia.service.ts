import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Anomalia } from '../models/anomalia';

@Injectable({
  providedIn: 'root',
})
export class AnomaliaService {
  constructor(public afs: AngularFirestore) {}

  async addAnomalia(anomalia: Anomalia) {
    const id = this.afs.createId();
    anomalia.id = id;
    // Para que Firestore admita "featureCoords", lo transformamos en un objeto
    const anomaliaObj = this.prepararParaDb(anomalia);
    return this.afs.collection('anomalias').doc(id).set(anomaliaObj);
  }
  getAnomalias$(plantaId: string, informeId: string): Observable<Anomalia[]> {
    const query$ = this.afs
      .collection<Anomalia>('anomalias', (ref) =>
        ref.where('informeId', '==', informeId).where('plantaId', '==', plantaId)
      )
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((doc) => {
            let data = doc.payload.doc.data() as Anomalia;
            data.id = doc.payload.doc.id;
            // Convertimos el objetjo en un array
            data.featureCoords = Object.values(data.featureCoords);
            return data;
          })
        )
      );
    return query$;
  }
  async updateAnomalia(anomalia: Anomalia) {
    const anomaliaObj = this.prepararParaDb(anomalia);
    return this.afs.doc('anomalias/' + anomalia.id).update(anomaliaObj);
  }

  private prepararParaDb(anomalia: Anomalia) {
    anomalia.featureCoords = { ...anomalia.featureCoords };
    return Object.assign({}, anomalia);
  }
}
