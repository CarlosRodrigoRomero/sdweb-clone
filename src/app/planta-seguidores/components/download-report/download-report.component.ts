import { Component, OnInit } from '@angular/core';

import { AngularFireStorage } from '@angular/fire/storage';

import { ReportControlService } from '@core/services/report-control.service';

@Component({
  selector: 'app-download-report',
  templateUrl: './download-report.component.html',
  styleUrls: ['./download-report.component.css'],
})
export class DownloadReportComponent implements OnInit {
  private selectedInformeId: string;
  imagesZipExist = true;
  imagesZipUrl: string;

  constructor(private storage: AngularFireStorage, private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    this.reportControlService.selectedInformeId$.subscribe((informeId) => {
      this.selectedInformeId = informeId;

      this.downloadImages();
    });
  }

  private downloadImages() {
    // Creamos una referencia a la imagen
    const storageRef = this.storage.ref('');
    const imagesZipRef = storageRef.child('informes/' + this.selectedInformeId + '/imagenes.zip');

    imagesZipRef
      .getDownloadURL()
      .toPromise()
      .then((url) => {
        this.imagesZipUrl = url;
      })
      .catch((error) => {
        switch (error.code) {
          case 'storage/object-not-found':
            // indicamos  que el zip no existe
            this.imagesZipExist = false;
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
