import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { AngularFireStorage } from '@angular/fire/storage';

import { Subscription } from 'rxjs';

import { ReportControlService } from '@data/services/report-control.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { PdfService } from '@data/services/pdf.service';
import { DownloadReportService } from '@data/services/download-report.service';
import { ZonesService } from '@data/services/zones.service';
import { ThermalService } from '@data/services/thermal.service';

import { Seguidor } from '@core/models/seguidor';

import { PdfDialogComponent } from '../pdf-dialog/pdf-dialog.component';

@Component({
  selector: 'app-pdf',
  templateUrl: './pdf.component.html',
  styleUrls: ['./pdf.component.css'],
})
export class PdfComponent implements OnInit, OnDestroy {
  private apartadosInforme: string[] = [];
  private emailSelected: string;
  oldPdf = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private storage: AngularFireStorage,
    private reportControlService: ReportControlService,
    private http: HttpClient,
    private anomaliaService: AnomaliaService,
    public dialog: MatDialog,
    private pdfService: PdfService,
    private downloadReportService: DownloadReportService,
    private zonesService: ZonesService,
    private thermalService: ThermalService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => {
        const informe = this.reportControlService.informes.find((inf) => inf.id === informeId);
        if (informe !== undefined) {
          if (
            (informe.hasOwnProperty('servidorCapas') && informe.servidorCapas === 'geoserver') ||
            !this.reportControlService.plantaFija
          ) {
            this.oldPdf = false;
          } else {
            this.oldPdf = true;
          }
        }
      })
    );

    this.subscriptions.add(this.pdfService.apartadosInforme$.subscribe((apt) => (this.apartadosInforme = apt)));
    this.subscriptions.add(this.pdfService.emailSelected$.subscribe((email) => (this.emailSelected = email)));

    this.subscriptions.add(
      this.pdfService.generatePdf$.subscribe((gen) => {
        if (gen) {
          this.download();
        }
      })
    );
  }

  openDialog() {
    this.dialog.open(PdfDialogComponent);

    // reseteamos el valor de generatePdf
    this.pdfService.generatePdf = false;
  }

  download() {
    const json = this.generateJson();
    // console.log(json);
    this.saveJson(json);
  }

  generateJson(): any {
    const json = { idioma: 'es' };
    if (this.downloadReportService.englishLang) {
      json.idioma = 'en';
    }

    let indexInforme = 0;
    const informe = this.reportControlService.informes.find((inf, index) => {
      if (inf.id === this.reportControlService.selectedInformeId) {
        indexInforme = index;
        return true;
      }
    });
    json['informe'] = informe;

    json['planta'] = this.reportControlService.planta;

    json['apartados'] = this.apartadosInforme;

    json['criterioCriticidad'] = this.anomaliaService.criterioCriticidad;

    json['locAreas'] = Object.assign({}, this.zonesService.zonesBySize[0]);

    json['sliderMin'] = this.thermalService.sliderMin[indexInforme];
    json['sliderMax'] = this.thermalService.sliderMax[indexInforme];

    json['email'] = this.emailSelected;

    if (this.reportControlService.plantaFija) {
      const anomalias = Object.assign(
        {},
        this.reportControlService.allAnomalias.filter((anom) => anom.informeId === informe.id)
      );
      json['anomalias'] = anomalias;
    } else {
      const seguidores = Object.assign(
        {},
        (this.reportControlService.allFilterableElements as Seguidor[]).filter((seg) => seg.informeId === informe.id)
      );
      json['seguidores'] = seguidores;
    }

    return json;
  }

  saveJson(json: any) {
    const jsonString = JSON.stringify(json);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const ref = this.storage.ref('').child('informes/' + this.reportControlService.selectedInformeId + '/data.json');
    ref.put(blob).then(() => {
      console.log('Archivo subido');

      // this.downloadPdf();
    });
  }

  downloadPdf() {
    const url = 'https://node-pdf-rcpywurt6q-uc.a.run.app';

    const params = new HttpParams().set('informeId', this.reportControlService.selectedInformeId);

    this.http
      .get(url, { responseType: 'text', params })
      .toPromise()
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
