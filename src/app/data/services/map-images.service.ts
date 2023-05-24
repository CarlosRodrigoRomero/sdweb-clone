import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { MapImage } from '@core/models/mapImages';

@Injectable({
  providedIn: 'root',
})
export class MapImagesService {
  private mapImagesCollection: AngularFirestoreCollection<MapImage>;
  mapImages: MapImage[] = [];

  constructor(private afs: AngularFirestore, private router: Router) {
    const informeId = this.router.url.split('/')[this.router.url.split('/').length - 1];
    this.mapImagesCollection = this.afs.collection<MapImage>('informes/' + informeId + '/mapImages');
  }

  getMapImages(): Observable<MapImage[]> {
    return this.mapImagesCollection.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as MapImage;
          const id = a.payload.doc.id;

          // Convertimos el objeto en un array
          data.coords = Object.values(data.coords);

          return { id, ...data };
        })
      )
    );
  }
}
