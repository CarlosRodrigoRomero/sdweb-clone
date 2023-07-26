import { Component, OnInit } from '@angular/core';
import * as exifr from 'exifr';

export interface ImageData {
  key: string;
  value: any;
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
  currentIndex = 0;
  fileName: string = "";


  async handleChange(event) {
    for (let i = 0; i < event.target.files.length; i++) {
      const file = event.target.files[i];

      // Ignorar los archivos que no sean jpg dando un aviso al usuario
      if (file.type !== 'image/jpeg') {
        alert(`Estás intentando subir el archivo ${file.name} y es de tipo ${file.type}. Este archivo se ignorará. Solo se procesarán archivos .jpg`);
        continue;
      }

      const output = await exifr.parse(file);
      this.imagesData.push(output);
    }
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
}