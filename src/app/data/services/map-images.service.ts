import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';

import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { MapImage } from '@core/models/mapImages';
import { COLOR } from '@data/constants/color';

@Injectable({
  providedIn: 'root',
})
export class MapImagesService {
  private informeId: string;
  private mapImagesCollection: AngularFirestoreCollection<MapImage>;
  mapImages: MapImage[] = [];
  private _urlImageThumbnail: string = undefined;
  urlImageThumbnail$ = new BehaviorSubject<string>(this._urlImageThumbnail);
  vuelos: string[] = [];
  private _imagePointSelected: MapImage = undefined;
  imagePointSelected$ = new BehaviorSubject<MapImage>(this._imagePointSelected);

  constructor(private afs: AngularFirestore, private router: Router, private storage: AngularFireStorage) {
    this.informeId = this.router.url.split('/')[this.router.url.split('/').length - 1];
    this.mapImagesCollection = this.afs.collection<MapImage>('informes/' + this.informeId + '/imagesMap');
  }

  getMapImages(): Observable<MapImage[]> {
    return this.mapImagesCollection.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a, index) => {
          const data = a.payload.doc.data() as MapImage;
          const id = a.payload.doc.id;

          // Convertimos el objeto en un array
          data.coords = Object.values(data.coords);

          return { id, ...data };
        })
      )
    );
  }

  getImageThumbnail(thumbnailPath: string) {
    if (thumbnailPath !== undefined) {
      // Creamos una referencia a la imagen
      const storageRef = this.storage.ref('');

      let imageRef = storageRef.child('vuelos/' + this.informeId + '/thumbnails/' + thumbnailPath);

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

  getVueloColor(vuelo: string) {
    const index = this.vuelos.indexOf(vuelo);
    const colorIndex = index % COLOR.clusterColors.length;
    return COLOR.clusterColors[colorIndex];
  }

  get urlImageThumbnail() {
    return this._urlImageThumbnail;
  }

  set urlImageThumbnail(value: string) {
    this._urlImageThumbnail = value;
    this.urlImageThumbnail$.next(value);
  }

  get imagePointSelected() {
    return this._imagePointSelected;
  }

  set imagePointSelected(value: MapImage) {
    this._imagePointSelected = value;
    this.imagePointSelected$.next(value);
  }
}
