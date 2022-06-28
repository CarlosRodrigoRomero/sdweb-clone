import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';

import { AngularFireStorage } from '@angular/fire/storage';

import { Subscription } from 'rxjs';

import { ReportControlService } from '@data/services/report-control.service';
import { DemoService } from '@data/services/demo.service';

@Component({
  selector: 'app-download-report',
  templateUrl: './download-report.component.html',
  styleUrls: ['./download-report.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class DownloadReportComponent implements OnInit, OnDestroy {
  private selectedInformeId: string;
  imagesZipExist = true;
  imagesZipUrl: string;
  excelExist = true;
  excelUrl: string;
  plantaDemo = false;
  pdfDemo: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private storage: AngularFireStorage,
    public reportControlService: ReportControlService,
    private demoService: DemoService
  ) {}

  ngOnInit(): void {
    this.pdfDemo = this.demoService.pdf;

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => {
        this.selectedInformeId = informeId;

        // excluimos DEMO
        if (this.reportControlService.plantaId === 'egF0cbpXnnBnjcrusoeR') {
          this.plantaDemo = true;

          this.excelUrl =
            'https://firebasestorage.googleapis.com/v0/b/sdweb-d33ce.appspot.com/o/informes%2F62dvYbGgoMkMNCuNCOEc%2Finforme.xlsx?alt=media&token=05aab4b1-452d-4822-8a50-dc788739a620';

          this.imagesZipExist = false;
        } else {
          this.downloadExcel();
          this.downloadImages();
        }
      })
    );

    if (this.reportControlService.plantaId === 'egF0cbpXnnBnjcrusoeR') {
      this.plantaDemo = true;
    }
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
