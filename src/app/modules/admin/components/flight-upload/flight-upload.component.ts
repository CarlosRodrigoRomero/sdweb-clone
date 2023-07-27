import { Component, OnInit } from '@angular/core';
import * as exifr from 'exifr';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

export interface ImageData {
  key: string;
  value: any;
  GPSLatitude: number;
  GPSLongitude: number;
  name: string;

  //Pruebas para clasificar en grupos
  lat?: number;
  long?: number;
  group?: number;
}

@Component({
  selector: 'app-flight-upload',
  templateUrl: './flight-upload.component.html',
  styleUrls: ['./flight-upload.component.css']
})
export class FlightUploadComponent implements OnInit {
  ngOnInit(): void {
  }
  imagesData: any[] = [];
  imageGroups: ImageData[][] = [];

  currentIndex = 0;
  fileName: string = "";

  imageThumbnails: SafeUrl[] = [];

  //Pruebas para clasificar en grupos
  currentGroup = 0;

  constructor(private sanitizer: DomSanitizer) { }
  async handleChange(event) {
    for (let i = 0; i < event.target.files.length; i++) {
      const file = event.target.files[i];

      // Ignorar los archivos que no sean jpg dando un aviso al usuario
      if (file.type !== 'image/jpeg') {
        alert(`Estás intentando subir el archivo ${file.name} y es de tipo ${file.type}. Este archivo se ignorará. Solo se procesarán archivos .jpg`);
        continue;
      }

      var output: ImageData = await exifr.parse(file, ['GPSLatitude', 'GPSLongitude']);
      output.name = file.name;

      // Verificar si las coordenadas GPS existen
      if (!output.GPSLatitude || !output.GPSLongitude) {
        alert(`El archivo ${file.name} no contiene información de GPS. Este archivo se ignorará.`);
        continue;
      }

      // Convertir las coordenadas de DMS a decimal
      output.GPSLatitude = this.dmsToDecimal(output.GPSLatitude[0], output.GPSLatitude[1], output.GPSLatitude[2]);
      output.GPSLongitude = this.dmsToDecimal(output.GPSLongitude[0], output.GPSLongitude[1], output.GPSLongitude[2]);

      const thumbnail = await exifr.thumbnail(file);
      this.imagesData.push(output);
      this.imageThumbnails.push(this.getSanitizedUrl(thumbnail));

      // Asignar cada imagen a un grupo basado en su proximidad a todas las imágenes en el grupo
      let assigned = false;
      for (let group of this.imageGroups) {
        for(let groupImage of group){
          if (this.calculateDistance(output.GPSLatitude, output.GPSLongitude, groupImage.GPSLatitude, groupImage.GPSLongitude) <= 0.5) {
            group.push(output);
            assigned = true;
            break;
          }
        }
        if(assigned) break;
      }
      if (!assigned) {
        this.imageGroups.push([output]);
      }
    }
  }

  dmsToDecimal(degrees: number, minutes: number, seconds: number) {
    return degrees + minutes / 60 + seconds / 3600;
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // radio medio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
      ;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // distancia en km
    return d;
  }

  deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  nextImage() {
    if (this.currentIndex < this.imagesData.length - 1) {
      this.currentIndex++;
    }
  }

  prevImage() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  get currentImage() {
    return this.imagesData[this.currentIndex];
  }

  getSanitizedUrl(buffer: Buffer | Uint8Array): SafeUrl {
    let TYPED_ARRAY = new Uint8Array(buffer);
    const STRING_CHAR = TYPED_ARRAY.reduce((data, byte) => {
      return data + String.fromCharCode(byte);
    }, '');
    let base64String = btoa(STRING_CHAR);
    return this.sanitizer.bypassSecurityTrustUrl('data:image/jpeg;base64,' + base64String);
  }
}