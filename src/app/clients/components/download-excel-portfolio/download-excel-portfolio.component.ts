import { Component, OnInit } from '@angular/core';

import { AngularFireStorage } from '@angular/fire/storage';

import { PortfolioControlService } from '@core/services/portfolio-control.service';

@Component({
  selector: 'app-download-excel-portfolio',
  templateUrl: './download-excel-portfolio.component.html',
  styleUrls: ['./download-excel-portfolio.component.css'],
})
export class DownloadExcelPortfolioComponent implements OnInit {
  userDemo = false;

  constructor(private storage: AngularFireStorage, private portfolioControlService: PortfolioControlService) {}

  ngOnInit(): void {
    if (this.portfolioControlService.user.uid === 'xsx8U7BrLRU20pj9Oa35ZbJIggx2') {
      this.userDemo = true;
    }
  }

  downloadExcel() {
    // Creamos una referencia al archivo que queremos descargar
    const urlFile: string = '';
    const pathRef = this.storage.ref(urlFile);
    const fileRef = pathRef.child('images/stars.jpg');

    // Obtenemos la URL y descargamos el archivo capturando los posibles errores
    fileRef
      .getDownloadURL()
      .then((url) => {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = (event) => {
          const blob = xhr.response;
        };
        xhr.open('GET', url);
        xhr.send();
      })
      .catch((error) => {
        switch (error.code) {
          case 'storage/object-not-found':
            // File doesn't exist
            break;

          case 'storage/unauthorized':
            // User doesn't have permission to access the object
            break;

          case 'storage/canceled':
            // User canceled the upload
            break;

          case 'storage/unknown':
            // Unknown error occurred, inspect the server response
            break;
        }
      });
  }
}
