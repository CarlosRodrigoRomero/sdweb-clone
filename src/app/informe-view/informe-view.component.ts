import { Component, OnInit } from '@angular/core';

import { PcService } from '@core/services/pc.service';
import { ActivatedRoute } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/storage';

import { take } from 'rxjs/operators';
import { PcInterface } from '@core/models/pc';
import { InformeInterface } from '@core/models/informe';
import { GLOBAL } from '@core/services/global';
import { PlantaInterface } from '@core/models/planta';
import { InformeService } from '@core/services/informe.service';
import { PlantaService } from '@core/services/planta.service';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-informe-view',
  templateUrl: './informe-view.component.html',
  styleUrls: ['./informe-view.component.css'],
})
export class InformeViewComponent implements OnInit {
  public isLoaded1: boolean;
  public isLoaded2: boolean;
  public isLoaded3: boolean;
  public dataSeveridad: any;
  public chartOptions: any;
  public filteredPcs: PcInterface[];
  public allPcs: PcInterface[];
  public allPcsConSeguidores: PcInterface[];
  public seguidores: PcInterface[];
  private informeId: string;
  public informe: InformeInterface;
  public planta: PlantaInterface;
  public irradianciaMedia: number;
  public isLocalhost: boolean;
  public imagenesDownloadUrl: string;
  public excelDownloadUrl: string;
  public allowDownloads: boolean;
  public empresaNombre: string;

  numSeveridad = new Array(GLOBAL.labels_severidad.length).fill(0).map((_, i) => i + 1);
  public countSeveridad: number[];

  constructor(
    private informeService: InformeService,
    private plantaService: PlantaService,
    private storage: AngularFireStorage,
    private pcService: PcService,
    private route: ActivatedRoute,
    private auth: AuthService
  ) {
    this.allowDownloads = true;
    this.isLocalhost = location.hostname === 'localhost';
    this.countSeveridad = new Array();
    this.informeId = this.route.snapshot.paramMap.get('id');
    this.informeService
      .getInforme(this.informeId)
      // .pipe(take(1))
      .subscribe((informe) => {
        this.informeService.set(informe);
        this.getPcsList(informe);
        this.informe = informe;
        this.storage
          .ref(`informes/${this.informe.id}/informe.xlsx`)
          .getDownloadURL()
          .pipe(take(1))
          .subscribe((res) => {
            this.excelDownloadUrl = res;
          });
        this.storage
          .ref(`informes/${this.informe.id}/imagenes.zip`)
          .getDownloadURL()
          .pipe(take(1))
          .subscribe((res) => {
            this.imagenesDownloadUrl = res;
          });
        this.plantaService
          .getPlanta(informe.plantaId)
          .pipe(take(1))
          .subscribe((planta) => {
            this.plantaService.set(planta);
            this.planta = planta;
            this.isLoaded1 = true;
            this.plantaService.getUserAreas$(planta.id).subscribe((userAreas) => {
              if (userAreas.length > 0) {
                this.allowDownloads = false;
              }
            });
          });
      });
  }

  ngOnInit() {
    this.chartOptions = {
      legend: { display: false },
    };
    this.dataSeveridad = {
      labels: GLOBAL.labels_severidad,
      datasets: [
        {
          label: 'Clase',
          backgroundColor: GLOBAL.colores_severidad,
          hoverBackgroundColor: GLOBAL.colores_severidad,
          data: [1, 1, 1, 1],
        },
      ],
    };
    this.auth.user$.subscribe((user) => (this.empresaNombre = user.empresaNombre));
  }

  // receivePcs($event) {
  //   this.filteredPcs = $event;
  //   console.log('receive pcs', $event);
  // }

  getPcsList(informe: InformeInterface) {
    let filtroSeveridad;
    this.pcService
      .getPcs(informe.id, informe.plantaId)
      .pipe(take(1))
      .subscribe((response) => {
        this.allPcsConSeguidores = response;
        // this.allPcsConSeguidores = response.map((pc, i, a) => {
        //  Les añadimos los observables de los archivos....
        // Se ha eliminado ya que tardaba mucho en cargar...
        // pc.downloadUrlRjpg$ = this.storage.ref(`informes/${this.informeId}/rjpg/${pc.archivoPublico}`).getDownloadURL();
        // pc.downloadUrl$ = this.storage
        //   .ref(`informes/${this.informeId}/jpg/${pc.archivoPublico}`)
        //   .getDownloadURL();
        // pc.downloadUrlVisual$ = this.storage.ref(`informes/${this.informeId}/jpgVisual/_mini_${pc.archivoPublico}`).getDownloadURL();

        //   return pc;
        // });
        this.seguidores = this.allPcsConSeguidores.filter((pc, i, a) => {
          return pc.tipo === 0;
        });
        this.allPcs = this.allPcsConSeguidores.filter((pc, i, a) => {
          return pc.tipo > 0;
        });
        this.pcService.set(this.allPcs);
        this.irradianciaMedia = this.allPcsConSeguidores.sort(this.compareIrradiancia)[
          Math.round(this.allPcs.length / 2)
        ].irradiancia;

        for (const j of this.numSeveridad) {
          filtroSeveridad = this.allPcs.filter((pc) => this.pcService.getPcCoA(pc) === j);
          this.countSeveridad.push(filtroSeveridad.length);
        }
        this.initializeChart();
        this.isLoaded2 = true;
      });
  }

  initializeChart() {
    this.dataSeveridad = {
      labels: GLOBAL.labels_severidad,
      datasets: [
        {
          label: 'Severidad',
          backgroundColor: GLOBAL.colores_severidad,
          hoverBackgroundColor: GLOBAL.colores_severidad,
          data: this.countSeveridad,
        },
      ],
    };
    this.isLoaded3 = true;
  }

  downloadInforme() {
    this.storage
      .ref(`informes/${this.informe.id}/informe.zip`)
      .getDownloadURL()
      .subscribe((downloadUrl) => {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = (event) => {
          /* Create a new Blob object using the response
           *  data of the onload object.
           */
          const blob = new Blob([xhr.response], { type: 'image/jpg' });
          const a: any = document.createElement('a');
          a.style = 'display: none';
          document.body.appendChild(a);
          const url = window.URL.createObjectURL(blob);
          a.href = url;
          a.download = `${this.informe.fecha} - ${this.planta.nombre}.zip`;
          a.click();
          window.URL.revokeObjectURL(url);
        };
        xhr.open('GET', downloadUrl);
        xhr.send();
      });
  }

  downloadInformeExcel() {
    this.storage
      .ref(`informes/${this.informe.id}/excel.xlsx`)
      .getDownloadURL()
      .subscribe((downloadUrl) => {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = (event) => {
          /* Create a new Blob object using the response
           *  data of the onload object.
           */
          const blob = new Blob([xhr.response], { type: 'image/jpg' });
          const a: any = document.createElement('a');
          a.style = 'display: none';
          document.body.appendChild(a);
          const url = window.URL.createObjectURL(blob);
          a.href = url;
          a.download = `${this.informe.fecha}_${this.planta.nombre}.xlsx`;
          a.click();
          window.URL.revokeObjectURL(url);
        };
        xhr.open('GET', downloadUrl);
        xhr.send();
      });
  }

  compareIrradiancia(a: PcInterface, b: PcInterface) {
    if (a.irradiancia < b.irradiancia) {
      return -1;
    }
    if (a.irradiancia > b.irradiancia) {
      return 1;
    }
    return 0;
  }

  public calificacionMae(mae: number) {
    if (mae <= 0.1) {
      return 'muy bueno';
    } else if (mae <= 0.2) {
      return 'correcto';
    } else {
      return 'mejorable';
    }
  }

  //DOWNLOAD
  downloadEXCEL2() {
    //Elimninar columnas
    const exportData = this.allPcs.map((pc) => {
      GLOBAL.columnasExcluirCSV.forEach((col) => {
        delete pc[col];
      });
      return pc;
    });

    //
    let csvData = this.ConvertToCSV(exportData);
    let aux = document.createElement('a');
    aux.setAttribute('style', 'display:none;');
    document.body.appendChild(aux);
    var blob = new Blob([csvData], { type: 'text/csv' });
    var url = window.URL.createObjectURL(blob);
    aux.href = url;
    var x: Date = new Date();
    var link: string = 'filename_' + x.getMonth() + '_' + x.getDay() + '.csv';
    aux.download = link.toLocaleLowerCase();
    aux.click();
  }

  // convert Json to CSV data in Angular2
  ConvertToCSV(objArray) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = '';
    var row = '';

    for (var index in objArray[0]) {
      //Now convert each value to string and comma-separated
      row += index + ',';
    }
    row = row.slice(0, -1);
    //append Label row with line break
    str += row + '\r\n';

    for (var i = 0; i < array.length; i++) {
      var line = '';
      for (var index in array[i]) {
        if (line != '') line += ',';

        line += array[i][index];
      }
      str += line + '\r\n';
    }
    return str;
  }
}
