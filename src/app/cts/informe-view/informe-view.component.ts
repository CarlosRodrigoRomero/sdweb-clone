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
  private informeId: string;
  public informe: InformeInterface;
  public planta: PlantaInterface;

  numSeveridad = new Array(GLOBAL.labels_severidad.length).fill(0).map( (_, i) => i + 1 );
  public countSeveridad: number[];

  constructor(
    private informeService: InformeService,
    private plantaService: PlantaService,
    private storage: AngularFireStorage,
    private pcService: PcService,
    private route: ActivatedRoute
  ) {
    this.countSeveridad = new Array();
    this.informeId = this.route.snapshot.paramMap.get('id');
    this.informeService.getInforme(this.informeId).subscribe( informe => {
      this.informe = informe;
      this.plantaService.getPlanta(informe.plantaId).subscribe( planta => {
        console.log('getPlanta', planta);
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
          this.allPcs = response.map( (pc, i, a) => {
            pc.downloadUrlRjpg$ = this.storage.ref(`informes/${this.informeId}/rjpg/${pc.archivoPublico}`).getDownloadURL();
            pc.downloadUrl$ = this.storage.ref(`informes/${this.informeId}/jpg/${pc.archivoPublico}`).getDownloadURL();
            pc.downloadUrlVisual$ = this.storage.ref(`informes/${this.informeId}/jpgVisual/_mini_${pc.archivoPublico}`).getDownloadURL();
            return pc;
          });
          for (let j of this.numSeveridad) {
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

}

