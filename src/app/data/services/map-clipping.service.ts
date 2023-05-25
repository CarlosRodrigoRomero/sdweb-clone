import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { MapClipping } from '@core/models/mapClipping';

@Injectable({
  providedIn: 'root',
})
export class MapClippingService {
  private mapClippingCollection: AngularFirestoreCollection<MapClipping>;

  constructor(private afs: AngularFirestore, private router: Router) {
    const informeId = this.router.url.split('/')[this.router.url.split('/').length - 1];
    this.mapClippingCollection = this.afs.collection<MapClipping>('informes/' + informeId + '/mapClippings');
  }

  getMapClippings(): Observable<MapClipping[]> {
    return this.mapClippingCollection.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as MapClipping;
          const id = a.payload.doc.id;

          // Convertimos el objeto en un array
          data.coords = Object.values(data.coords);

          return { id, ...data };
        })
      )
    );
  }

  getMapClipping(id: string): Observable<MapClipping> {
    return this.mapClippingCollection.doc<MapClipping>(id).valueChanges();
  }

  addMapClipping(mapClipping: MapClipping): Promise<any> {
    // obtenemos un ID aleatorio
    const id = this.afs.createId();
    mapClipping.id = id;

    // preparamos las coords para la DB
    mapClipping.coords = { ...mapClipping.coords };

    return this.mapClippingCollection.doc(id).set(mapClipping);
  }

  updateMapClipping(mapClipping: MapClipping): Promise<void> {
    return this.mapClippingCollection.doc<MapClipping>(mapClipping.id).update(mapClipping);
  }

  deleteMapClipping(id: string): Promise<void> {
    return this.mapClippingCollection.doc(id).delete();
  }
}
