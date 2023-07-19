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
import { FilterService } from '@data/services/filter.service';

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
  private filteredPdf = false;

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
    private thermalService: ThermalService,
    private filterService: FilterService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(this.pdfService.apartadosInforme$.subscribe((apt) => (this.apartadosInforme = apt)));
    this.subscriptions.add(this.pdfService.emailSelected$.subscribe((email) => (this.emailSelected = email)));
    this.subscriptions.add(this.pdfService.filteredPdf$.subscribe((filtered) => (this.filteredPdf = filtered)));

    this.subscriptions.add(
      this.pdfService.generatePdf$.subscribe((gen) => {
        if (gen) {
          this.download();

          this.pdfService.generatePdf = false;
        }
      })
    );
  }

  openDialog() {
    this.dialog.open(PdfDialogComponent);

    // reseteamos el valor de filteredPdf
    this.pdfService.filteredPdf = false;

    // reseteamos el valor de generatePdf
    this.pdfService.generatePdf = false;
  }

  download() {
    const json = this.generateJson();

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

    let zonas = this.zonesService.zonesBySize[0];
    if (zonas === undefined || zonas.length === 0) {
      zonas = this.zonesService.locAreaSeguidores;
    }
    json['locAreas'] = Object.assign({}, zonas);

    json['sliderMin'] = this.thermalService.sliderMin[indexInforme];
    json['sliderMax'] = this.thermalService.sliderMax[indexInforme];

    json['email'] = this.emailSelected;
    json['totalAnoms'] = this.reportControlService.allAnomalias.length;

    if (this.filteredPdf) {
      json['filtered'] = true;
    } else {
      json['filtered'] = false;
    }

    if (this.reportControlService.plantaFija) {
      let anomalias;
      if (this.filteredPdf) {
        anomalias = Object.assign(
          {},
          this.filterService.filteredElements.filter((anom) => anom.informeId === informe.id)
        );
      } else {
        anomalias = Object.assign(
          {},
          this.reportControlService.allAnomalias.filter((anom) => anom.informeId === informe.id)
        );
      }

      json['anomalias'] = anomalias;
    } else {
      let seguidores;
      if (this.filteredPdf) {
        seguidores = Object.assign(
          {},
          (this.filterService.filteredElements as Seguidor[]).filter((seg) => seg.informeId === informe.id)
        );
      } else {
        seguidores = Object.assign(
          {},
          (this.reportControlService.allFilterableElements as Seguidor[]).filter((seg) => seg.informeId === informe.id)
        );
      }

      json['seguidores'] = seguidores;
    }

    let indexLargestZones = 0;
    // obtenemos el indece de las zonas por las que agruparemos
    if (this.reportControlService.planta.sizeZonesClusters !== undefined) {
      indexLargestZones = this.reportControlService.planta.sizeZonesClusters;
    }

    json['zonas'] = Object.assign({}, this.zonesService.zonesBySize[indexLargestZones]);

    return json;
  }

  saveJson(json: any) {
    const jsonString = JSON.stringify(json);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const ref = this.storage.ref('').child('informes/' + this.reportControlService.selectedInformeId + '/data.json');
    ref.put(blob).then(() => {
      // console.log('Archivo subido');

      this.downloadPdf();
    });
  }

  downloadPdf() {
    // para pruebas en local
    // const url = 'https://node-pdf-rcpywurt6q-uc.a.run.app';
    const url = 'http://localhost:8080';

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
