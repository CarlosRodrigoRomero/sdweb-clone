import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { MapDivision } from '@core/models/mapDivision';

@Injectable({
  providedIn: 'root',
})
export class MapDivisionsService {
  private mapDivisionsCollection: AngularFirestoreCollection<MapDivision>;

  constructor(private afs: AngularFirestore, private router: Router) {
    const informeId = this.router.url.split('/')[this.router.url.split('/').length - 1];
    this.mapDivisionsCollection = this.afs.collection<MapDivision>('informes/' + informeId + '/mapDivisions');
  }

  getMapDivisions(): Observable<MapDivision[]> {
    return this.mapDivisionsCollection.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as MapDivision;
          const id = a.payload.doc.id;

          // Convertimos el objeto en un array
          data.coords = Object.values(data.coords);

          return { id, ...data };
        })
      )
    );
  }

  getMapDivision(id: string): Observable<MapDivision> {
    return this.mapDivisionsCollection.doc<MapDivision>(id).valueChanges();
  }

  addMapDivision(mapDivision: MapDivision): Promise<any> {
    // obtenemos un ID aleatorio
    const id = this.afs.createId();
    mapDivision.id = id;

    // preparamos las coords para la DB
    mapDivision.coords = { ...mapDivision.coords };

    return this.mapDivisionsCollection.doc(id).set(mapDivision);
  }

  updateMapDivision(mapDivision: MapDivision): Promise<void> {
    return this.mapDivisionsCollection.doc<MapDivision>(mapDivision.id).update(mapDivision);
  }

  deleteMapDivision(id: string): Promise<void> {
    return this.mapDivisionsCollection.doc(id).delete();
  }
}
