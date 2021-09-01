import { Component, OnDestroy, OnInit } from '@angular/core';

import { AngularFireStorage } from '@angular/fire/storage';

import { Subscription } from 'rxjs';

import { ReportControlService } from '@core/services/report-control.service';

@Component({
  selector: 'app-download-report',
  templateUrl: './download-report.component.html',
  styleUrls: ['./download-report.component.css'],
})
export class DownloadReportComponent implements OnInit, OnDestroy {
  private selectedInformeId: string;
  imagesZipExist = true;
  imagesZipUrl: string;
  excelExist = true;
  excelUrl: string;

  private subscriptions: Subscription = new Subscription();

  constructor(private storage: AngularFireStorage, private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => {
        this.selectedInformeId = informeId;

        this.downloadExcel();
        this.downloadImages();
      })
    );
  }

  private downloadExcel() {
    // Creamos la referencia
    const storageRef = this.storage.ref('');
    const excelRef = storageRef.child('informes/' + this.selectedInformeId + '/informe.xlsx');

    excelRef
      .getDownloadURL()
      .toPromise()
      .then((url) => {
        this.excelUrl = url;
      })
      .catch((error) => {
        switch (error.code) {
          case 'storage/object-not-found':
            // indicamos  que el excel no existe
            this.excelExist = false;
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

  private downloadImages() {
    // Creamos la referencia
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

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
