import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';

import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { MapImage } from '@core/models/mapImages';

@Injectable({
  providedIn: 'root',
})
export class MapImagesService {
  private informeId: string;
  private mapImagesCollection: AngularFirestoreCollection<MapImage>;
  mapImages: MapImage[] = [];
  private _urlImageThumbnail: string = undefined;
  urlImageThumbnail$ = new BehaviorSubject<string>(this._urlImageThumbnail);

  constructor(private afs: AngularFirestore, private router: Router, private storage: AngularFireStorage) {
    this.informeId = this.router.url.split('/')[this.router.url.split('/').length - 1];
    this.mapImagesCollection = this.afs.collection<MapImage>('informes/' + this.informeId + '/mapImages');
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

  getImageThumbnail(thumbnailId: string) {
    if (thumbnailId !== undefined) {
      // Creamos una referencia a la imagen
      const storageRef = this.storage.ref('');

      let imageExt = '.png';
      let imageRef = storageRef.child('vuelos/' + this.informeId + '/thumbnails/' + thumbnailId + imageExt);

      // Obtenemos la URL y descargamos el archivo capturando los posibles errores
      imageRef
        .getDownloadURL()
        .toPromise()
        .then((url) => {
          this.urlImageThumbnail = url;
        })
        .catch((error) => {
          switch (error.code) {
            case 'storage/object-not-found':
              console.log("File doesn't exist");
              break;

            case 'storage/unauthorized':
              console.log("User doesn't have permission to access the object");
              break;

            case 'storage/canceled':
              console.log('User canceled the upload');
              break;

            case 'storage/unknown':
              console.log('Unknown error occurred, inspect the server response');
              break;
          }
        });
    }
  }

  get urlImageThumbnail() {
    return this._urlImageThumbnail;
  }

  set urlImageThumbnail(value: string) {
    this._urlImageThumbnail = value;
    this.urlImageThumbnail$.next(value);
  }
}
