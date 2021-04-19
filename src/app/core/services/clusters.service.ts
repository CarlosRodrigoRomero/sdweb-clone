import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';

import { TrayectoriaInterface } from '@core/models/trayectoria';
import { PuntoTrayectoria } from '@core/models/puntoTrayectoria';
import moment from 'moment';

@Injectable({
  providedIn: 'root',
})
export class ClustersService {
  private trayectoriaDoc: AngularFirestoreDocument<TrayectoriaInterface>;
  private trayectoria: TrayectoriaInterface;
  private trayectoria$: Observable<TrayectoriaInterface>;
  private puntosTrayectoria: PuntoTrayectoria[] = [];
  public puntosTrayectoria$ = new BehaviorSubject<PuntoTrayectoria[]>(this.puntosTrayectoria);

  constructor(private afs: AngularFirestore) {}

  getPuntosTrayectoria(plantaId: string): Observable<PuntoTrayectoria[]> {
    // const puntosTrayectoriaRef = this.afs.collection('vuelos/' + plantaId + '/puntosTrayectoria');
    const puntosTrayectoriaRef = this.afs.collection('vuelos/' + 'Alconera02' + '/puntosTrayectoria');

    puntosTrayectoriaRef
      .valueChanges()
      .pipe(take(1))
      .subscribe((puntos: PuntoTrayectoria[]) => {
        // ordenamos los puntos por fecha
        this.puntosTrayectoria = puntos.sort((a, b) => this.dateStringToUnix(a.date) - this.dateStringToUnix(b.date));
        this.puntosTrayectoria$.next(this.puntosTrayectoria);
      });

    return this.puntosTrayectoria$;
  }

  getTrayectoria(plantaId: string) {
    // this.trayectoriaDoc = this.afs.doc<TrayectoriaInterface>('vuelos/' + plantaId + '/puntosTrayectoria');
    this.trayectoriaDoc = this.afs.doc<TrayectoriaInterface>('vuelos/' + 'Alconera02'); // TEST
    const puntosTrayectoriaCol = this.afs.collection('vuelos/' + 'Alconera02' + '/puntosTrayectoria'); // TEST

    return (this.trayectoria$ = this.trayectoriaDoc.snapshotChanges().pipe(
      map((action) => {
        if (action.payload.exists === false) {
          return null;
        } else {
          const data = action.payload.data() as TrayectoriaInterface;
          data.id = action.payload.id;
          puntosTrayectoriaCol;
          return data;
        }
      })
    ));
  }

  private dateStringToUnix(date: string) {
    const n = moment(date, 'DD/MM/YYYY hh:mm:ss').unix();

    return n;
  }
}
