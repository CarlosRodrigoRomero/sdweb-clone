import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { AngularFireStorage } from '@angular/fire/storage';

import { ReportControlService } from '@data/services/report-control.service';
import { AnomaliaService } from '@data/services/anomalia.service';

@Component({
  selector: 'app-pdf',
  templateUrl: './pdf.component.html',
  styleUrls: ['./pdf.component.css'],
})
export class PdfComponent implements OnInit {
  constructor(
    private storage: AngularFireStorage,
    private reportControlService: ReportControlService,
    private http: HttpClient,
    private anomaliaService: AnomaliaService
  ) {}

  ngOnInit(): void {}

  download() {
    const json = this.generateJson();
    // console.log(json);
    this.saveJson(json);
  }

  generateJson(): any {
    const json = { idioma: 'es' };
    const informe = this.reportControlService.informes.find(
      (inf) => inf.id === this.reportControlService.selectedInformeId
    );
    const anomalias = Object.assign(
      {},
      this.reportControlService.allAnomalias.filter((anom) => anom.informeId === informe.id)
    );

    json['informe'] = informe;
    json['anomalias'] = anomalias;
    json['planta'] = this.reportControlService.planta;
    json['apartados'] = [
      'introduccion',
      'criterios',
      'normalizacion',
      'datosVuelo',
      'irradiancia',
      'paramsTermicos',
      'perdidaPR',
      'clasificacion',
      'planoTermico',
      'planoVisual',
      'resultadosClase',
      'resultadosCatergoria',
      'resultadosPosicion',
    ];
    json['criterioCriticidad'] = this.anomaliaService.criterioCriticidad;

    return json;
  }

  saveJson(json: any) {
    const jsonString = JSON.stringify(json);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const ref = this.storage.ref('').child('informes/' + this.reportControlService.selectedInformeId + '/data.json');
    ref.put(blob).then(() => {
      console.log('Archivo subido');

      this.downloadPdf();
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
}
