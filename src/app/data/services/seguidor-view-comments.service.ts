import { Injectable } from '@angular/core';

import { AngularFireStorage } from '@angular/fire/storage';

import { BehaviorSubject } from 'rxjs';

import { Seguidor } from '@core/models/seguidor';

@Injectable({
  providedIn: 'root',
})
export class SeguidorViewCommentsService {
  private _thermalImageExist = true;
  thermalImageExist$ = new BehaviorSubject<boolean>(this._thermalImageExist);
  private _visualImageExist = true;
  visualImageExist$ = new BehaviorSubject<boolean>(this._visualImageExist);
  private _urlVisualImageSeguidor: string = undefined;
  urlVisualImageSeguidor$ = new BehaviorSubject<string>(this._urlVisualImageSeguidor);
  private _urlThermalImageSeguidor: string = undefined;
  urlThermalImageSeguidor$ = new BehaviorSubject<string>(this._urlThermalImageSeguidor);
  private _imagesLoaded = false;
  imagesLoaded$ = new BehaviorSubject<boolean>(this._imagesLoaded);

  visualCanvas: any;
  thermalCanvas: any;
  anomsCanvas: any;
  imagesWidth = 400;
  imagesHeight = this.imagesWidth / 1.25;

  constructor(private storage: AngularFireStorage) {}

  getImageSeguidor(seguidor: Seguidor, folder: string) {
    // const imageName = this.seguidorSelected.imageName;
    let imageName = seguidor.anomalias[0].archivoPublico;
    if (seguidor.anomaliasCliente.length > 0) {
      imageName = seguidor.anomaliasCliente[0].archivoPublico;
    }

    // Creamos una referencia a la imagen
    const storageRef = this.storage.ref('');
    const imageRef = storageRef.child('informes/' + seguidor.informeId + '/' + folder + '/' + imageName);

    // Obtenemos la URL y descargamos el archivo capturando los posibles errores
    imageRef
      .getDownloadURL()
      .toPromise()
      .then((url) => {
        if (folder === 'jpg') {
          // indicamos  que la imagen existe
          this.thermalImageExist = true;

          this.urlThermalImageSeguidor = url;
        } else {
          // indicamos  que la imagen existe
          this.visualImageExist = true;

          this.urlVisualImageSeguidor = url;
        }
      })
      .catch((error) => {
        switch (error.code) {
          case 'storage/object-not-found':
            if (folder === 'jpg') {
              // indicamos  que la imagen no existe
              this.thermalImageExist = false;
            } else {
              // indicamos  que la imagen no existe
              this.visualImageExist = false;
            }

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

  setImagesWidthAndHeight(): void {
    const width = window.innerWidth - 16;
    if (width < this.imagesWidth) {
      this.imagesWidth = width;
      this.imagesHeight = this.imagesWidth / 1.25;
    }
  }

  resetService() {
    this.thermalImageExist = true;
    this.visualImageExist = true;
    this.urlVisualImageSeguidor = undefined;
    this.urlThermalImageSeguidor = undefined;
    this.imagesLoaded = false;

    this.visualCanvas = undefined;
    this.thermalCanvas = undefined;
    this.anomsCanvas = undefined;
    this.imagesWidth = 400;
    this.imagesHeight = this.imagesWidth / 1.25;
  }

  get thermalImageExist() {
    return this._thermalImageExist;
  }

  set thermalImageExist(value: boolean) {
    this._thermalImageExist = value;
    this.thermalImageExist$.next(value);
  }

  get visualImageExist() {
    return this._visualImageExist;
  }

  set visualImageExist(value: boolean) {
    this._visualImageExist = value;
    this.visualImageExist$.next(value);
  }

  get urlVisualImageSeguidor() {
    return this._urlVisualImageSeguidor;
  }

  set urlVisualImageSeguidor(value: string) {
    this._urlVisualImageSeguidor = value;
    this.urlVisualImageSeguidor$.next(value);
  }

  get urlThermalImageSeguidor() {
    return this._urlThermalImageSeguidor;
  }

  set urlThermalImageSeguidor(value: string) {
    this._urlThermalImageSeguidor = value;
    this.urlThermalImageSeguidor$.next(value);
  }

  get imagesLoaded() {
    return this._imagesLoaded;
  }

  set imagesLoaded(value: boolean) {
    this._imagesLoaded = value;
    this.imagesLoaded$.next(value);
  }
}
