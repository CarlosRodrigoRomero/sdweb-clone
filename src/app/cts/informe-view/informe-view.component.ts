import { Component, OnInit } from '@angular/core';
import { GLOBAL } from '../../services/global';
import { PcInterface } from '../../models/pc';
import { PcService } from 'src/app/services/pc.service';
import { ActivatedRoute } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/storage';
import { InformeService } from '../../services/informe.service';
import { PlantaService } from '../../services/planta.service';
import { InformeInterface } from '../../models/informe';
import { PlantaInterface } from '../../models/planta';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-informe-view',
  templateUrl: './informe-view.component.html',
  styleUrls: ['./informe-view.component.css']
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
  public irradianciaMinima: number;
  public isLocalhost: boolean;
  public informeDownloadUrl: Observable<string>;

  numSeveridad = new Array(GLOBAL.labels_severidad.length).fill(0).map( (_, i) => i + 1 );
  public countSeveridad: number[];

  constructor(
    private informeService: InformeService,
    private plantaService: PlantaService,
    private storage: AngularFireStorage,
    private pcService: PcService,
    private route: ActivatedRoute
  ) {
    this.isLocalhost = location.hostname === 'localhost';
    this.countSeveridad = new Array();
    this.informeId = this.route.snapshot.paramMap.get('id');
    this.informeService.getInforme(this.informeId).subscribe( informe => {
      this.informe = informe;
      this.informeDownloadUrl = this.storage.ref(`informes/${this.informe.id}/informe.zip`).getDownloadURL();
      this.plantaService.getPlanta(informe.plantaId).subscribe( planta => {
        this.planta = planta;
        this.isLoaded1 = true;
      });
    });
  }

  ngOnInit() {
    this.getPcsList();
    this.chartOptions = {
      legend: {display: false}
    };
    this.dataSeveridad = {
      labels: GLOBAL.labels_severidad,
      datasets: [
          {
              label: 'Severidad',
              backgroundColor: GLOBAL.colores_severidad,
              hoverBackgroundColor: GLOBAL.colores_severidad,
              data: [1, 1, 1, 1]
          },
        ]
      };
  }

  // receivePcs($event) {
  //   this.filteredPcs = $event;
  //   console.log('receive pcs', $event);
  // }

  getPcsList() {
    let filtroSeveridad;
    this.pcService.getPcs(this.informeId).subscribe(
      response => {
          this.allPcsConSeguidores = response.map( (pc, i, a) => {
            //  Les añadimos los observables de los archivos....
            // Se ha eliminado ya que tardaba mucho en cargar...
            // pc.downloadUrlRjpg$ = this.storage.ref(`informes/${this.informeId}/rjpg/${pc.archivoPublico}`).getDownloadURL();
            // pc.downloadUrl$ = this.storage.ref(`informes/${this.informeId}/jpg/${pc.archivoPublico}`).getDownloadURL();
            // pc.downloadUrlVisual$ = this.storage.ref(`informes/${this.informeId}/jpgVisual/_mini_${pc.archivoPublico}`).getDownloadURL();

            return pc;
          });
          this.seguidores = this.allPcsConSeguidores.filter( (pc, i, a) => {
            return pc.tipo === 0;
          });
          this.allPcs = this.allPcsConSeguidores.filter( (pc, i, a) => {
            return pc.tipo > 0;

          });
          this.irradianciaMinima = this.allPcs.sort(this.compareIrradiancia)[0].irradiancia;

          for (const j of this.numSeveridad) {
            filtroSeveridad = this.allPcs.filter( pc => pc.severidad === j);
            this.countSeveridad.push(filtroSeveridad.length);
          }

          this.initializeChart();
          this.isLoaded2 = true;


          this.pcService.filteredPcs(this.allPcs);
      },
    );
  }


  initializeChart() {
    // console.log('count_sve', this.countSeveridad);

    this.dataSeveridad = {
      labels: GLOBAL.labels_severidad,
      datasets: [
          {
              label: 'Severidad',
              backgroundColor: GLOBAL.colores_severidad,
              hoverBackgroundColor: GLOBAL.colores_severidad,
              data: this.countSeveridad
          },
        ]
      };
    this.isLoaded3 = true;
  }

  downloadInforme() {
    this.storage.ref(`informes/${this.informe.id}/informe.zip`).getDownloadURL()
    .subscribe( downloadUrl => {
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
    this.storage.ref(`informes/${this.informe.id}/excel.xlsx`).getDownloadURL()
      .subscribe( downloadUrl => {
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

}

