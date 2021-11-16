import { Injectable } from '@angular/core';

import { AngularFireStorage } from '@angular/fire/storage';

import { fabric } from 'fabric';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ImagesLoadService {
  imgQuality = 3.5;
  jpgQuality = 0.95;

  widthIrradiancia = 499;
  private _imgIrradianciaBase64: string = undefined;
  imgIrradianciaBase64$ = new BehaviorSubject<string>(this._imgIrradianciaBase64);

  widthSuciedad = 501;
  private _imgSuciedadBase64: string = undefined;
  imgSuciedadBase64$ = new BehaviorSubject<string>(this._imgIrradianciaBase64);

  widthPortada = 600; // es el ancho de pagina completo
  private _imgPortadaBase64: string = undefined;
  imgPortadaBase64$ = new BehaviorSubject<string>(this._imgPortadaBase64);

  widthLogoEmpresa = 200;
  heightLogoEmpresa: number;
  scaleImgLogoHeader: number;
  heightLogoHeader = 40;
  private _imgLogoBase64: string = undefined;
  imgLogoBase64$ = new BehaviorSubject<string>(this._imgLogoBase64);

  widthImgSolardroneTech = 300;
  private _imgSolardroneBase64: string = undefined;
  imgSolardroneBase64$ = new BehaviorSubject<string>(this._imgSolardroneBase64);

  widthFormulaMae = 200;
  private _imgFormulaMaeBase64: string = undefined;
  imgFormulaMaeBase64$ = new BehaviorSubject<string>(this._imgFormulaMaeBase64);

  widthCurvaMae = 300;
  private _imgCurvaMaeBase64: string = undefined;
  imgCurvaMaeBase64$ = new BehaviorSubject<string>(this._imgCurvaMaeBase64);

  constructor(private storage: AngularFireStorage) {}

  loadSelectedInformeImages(selectedInformeId: string) {
    this.storage
      .ref(`informes/${selectedInformeId}/irradiancia.png`)
      .getDownloadURL()
      .toPromise()
      .then((url) => {
        fabric.util.loadImage(
          url,
          (img) => {
            const canvas = document.createElement('canvas');
            const width =
              this.widthIrradiancia * this.imgQuality > img.width ? img.width : this.widthIrradiancia * this.imgQuality;
            const scaleFactor = width / img.width;
            canvas.width = width;
            canvas.height = img.height * scaleFactor;
            const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, img.height * scaleFactor);
            this.imgIrradianciaBase64 = canvas.toDataURL('image/jpeg', this.jpgQuality);
          },
          null,
          { crossOrigin: 'anonymous' }
        );
      })
      .catch((error) => {
        console.log('Error al obtener la imagen de irradiancia ', error);
        const canvas = document.createElement('canvas');
        this.imgIrradianciaBase64 = canvas.toDataURL('image/jpeg', this.jpgQuality);
      });

    this.storage
      .ref(`informes/${selectedInformeId}/suciedad.jpg`)
      .getDownloadURL()
      .toPromise()
      .then((url) => {
        fabric.util.loadImage(
          url,
          (img) => {
            const canvas = document.createElement('canvas');
            const width =
              this.widthSuciedad * this.imgQuality > img.width ? img.width : this.widthSuciedad * this.imgQuality;
            const scaleFactor = width / img.width;
            canvas.width = width;
            canvas.height = img.height * scaleFactor;
            const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, img.height * scaleFactor);
            this.imgSuciedadBase64 = canvas.toDataURL('image/jpeg', this.jpgQuality);
          },
          null,
          { crossOrigin: 'anonymous' }
        );
      })
      .catch((error) => {
        console.log('Error al obtener la imagen de suciedad ', error);
        const canvas = document.createElement('canvas');
        this.imgSuciedadBase64 = canvas.toDataURL('image/jpeg', this.jpgQuality);
      });

    this.storage
      .ref(`informes/${selectedInformeId}/portada.jpg`)
      .getDownloadURL()
      .toPromise()
      .then((url) => {
        fabric.util.loadImage(
          url,
          (img) => {
            const canvas = new fabric.Canvas('canvas');
            const width =
              this.widthPortada * this.imgQuality > img.width ? img.width : this.widthPortada * this.imgQuality;
            const scaleFactor = width / img.width;
            canvas.width = width;

            let height = img.height * scaleFactor;
            if (height > 1200) {
              height = 1200;
            }
            canvas.height = height;

            const image = new fabric.Image(img, {
              top: height,
              originY: 'bottom',
              scaleX: scaleFactor,
              scaleY: scaleFactor,
            });

            canvas.add(image);

            this.imgPortadaBase64 = canvas.toDataURL('image/jpeg', this.jpgQuality);
          },
          null,
          { crossOrigin: 'anonymous' }
        );
      })
      .catch((error) => {
        console.log('Error al obtener la imagen de portada ', error);
        const canvas = document.createElement('canvas');
        this.imgPortadaBase64 = canvas.toDataURL('image/jpeg', this.jpgQuality);
      });
  }

  loadFixedImages(empresaId: string): void {
    this.storage
      .ref(`empresas/${empresaId}/logo.jpg`)
      .getDownloadURL()
      .toPromise()
      .then((url) => {
        fabric.util.loadImage(
          url,
          (img) => {
            const canvas = document.createElement('canvas');
            const newWidth =
              this.widthLogoEmpresa * this.imgQuality > img.width ? img.width : this.widthLogoEmpresa * this.imgQuality;

            const scaleFactor = newWidth / img.width;
            const newHeight = img.height * scaleFactor;
            this.heightLogoEmpresa = newHeight;
            canvas.width = newWidth;
            canvas.height = newHeight;
            this.scaleImgLogoHeader = this.heightLogoHeader / newHeight;
            const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            this.imgLogoBase64 = canvas.toDataURL('image/jpeg', this.jpgQuality);
          },
          null,
          { crossOrigin: 'anonymous' }
        );
      })
      .catch((error) => {
        console.log('Error al obtener la imagen del logo ', error);
        const canvas = document.createElement('canvas');
        this.imgLogoBase64 = canvas.toDataURL('image/jpeg', this.jpgQuality);
      });

    // Cargamos Logo Solardrone
    fabric.util.loadImage('../../../assets/images/logo_sd_tecno.png', (img) => {
      const canvas = new fabric.Canvas('canvas');
      const newWidth =
        this.widthImgSolardroneTech * this.imgQuality > img.width
          ? img.width
          : this.widthImgSolardroneTech * this.imgQuality;

      const scaleFactor = newWidth / img.width;
      const newHeight = img.height * scaleFactor;

      canvas.width = newWidth;
      canvas.height = newHeight;

      const image = new fabric.Image(img, {
        scaleX: scaleFactor,
        scaleY: scaleFactor,
      });

      canvas.add(image);

      this.imgSolardroneBase64 = canvas.toDataURL('png');
    });

    // GRAFICO MAE
    fabric.util.loadImage(
      '../../../assets/images/maeCurva.png',
      (img) => {
        const canvas = document.createElement('canvas');
        const width =
          this.widthCurvaMae * this.imgQuality > img.width ? img.width : this.widthCurvaMae * this.imgQuality;
        const scaleFactor = width / img.width;
        canvas.width = width;
        canvas.height = img.height * scaleFactor;
        const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, img.height * scaleFactor);
        this.imgCurvaMaeBase64 = canvas.toDataURL('image/jpeg', this.jpgQuality);
      },
      null,
      { crossOrigin: 'anonymous' }
    );

    // FORMULA MAE
    fabric.util.loadImage(
      '../../../assets/images/formula_mae.png',
      (img) => {
        const canvas = document.createElement('canvas');
        const width =
          this.widthFormulaMae * this.imgQuality > img.width ? img.width : this.widthFormulaMae * this.imgQuality;
        const scaleFactor = width / img.width;
        canvas.width = width;
        canvas.height = img.height * scaleFactor;
        const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, img.height * scaleFactor);
        this.imgFormulaMaeBase64 = canvas.toDataURL('image/jpeg', this.jpgQuality);
      },
      null,
      { crossOrigin: 'anonymous' }
    );
  }

  ////////////////////////////////////////////////////////////

  get imgIrradianciaBase64() {
    return this._imgIrradianciaBase64;
  }

  set imgIrradianciaBase64(value) {
    this._imgIrradianciaBase64 = value;
    this.imgIrradianciaBase64$.next(value);
  }

  get imgSuciedadBase64() {
    return this._imgSuciedadBase64;
  }

  set imgSuciedadBase64(value) {
    this._imgSuciedadBase64 = value;
    this.imgSuciedadBase64$.next(value);
  }

  get imgPortadaBase64() {
    return this._imgPortadaBase64;
  }

  set imgPortadaBase64(value) {
    this._imgPortadaBase64 = value;
    this.imgPortadaBase64$.next(value);
  }

  get imgLogoBase64() {
    return this._imgLogoBase64;
  }

  set imgLogoBase64(value) {
    this._imgLogoBase64 = value;
    this.imgLogoBase64$.next(value);
  }

  get imgSolardroneBase64() {
    return this._imgSolardroneBase64;
  }

  set imgSolardroneBase64(value) {
    this._imgSolardroneBase64 = value;
    this.imgSolardroneBase64$.next(value);
  }

  get imgFormulaMaeBase64() {
    return this._imgFormulaMaeBase64;
  }

  set imgFormulaMaeBase64(value) {
    this._imgFormulaMaeBase64 = value;
    this.imgFormulaMaeBase64$.next(value);
  }

  get imgCurvaMaeBase64() {
    return this._imgCurvaMaeBase64;
  }

  set imgCurvaMaeBase64(value) {
    this._imgCurvaMaeBase64 = value;
    this.imgCurvaMaeBase64$.next(value);
  }
}
