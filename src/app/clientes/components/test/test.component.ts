import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/storage';

import { take } from 'rxjs/operators';

import { GLOBAL } from '@core/services/global';

import { PcInterface } from '@core/models/pc';
import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';

import { InformeService } from '@core/services/informe.service';
import { PlantaService } from '@core/services/planta.service';
import { AuthService } from '@core/services/auth.service';
import { PcService } from '@core/services/pc.service';

import { MatSidenav } from '@angular/material/sidenav';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css'],
})
export class TestComponent implements OnInit {
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

  @ViewChild('sidenavLeft') sidenavLeft: MatSidenav;
  @ViewChild('sidenavRight') sidenavRight: MatSidenav;

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
    this.informeService.getInforme(this.informeId).subscribe((informe) => {
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

  getPcsList(informe: InformeInterface) {
    let filtroSeveridad;
    this.pcService
      .getPcs(informe.id, informe.plantaId)
      .pipe(take(1))
      .subscribe((response) => {
        this.allPcsConSeguidores = response;
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

  compareIrradiancia(a: PcInterface, b: PcInterface) {
    if (a.irradiancia < b.irradiancia) {
      return -1;
    }
    if (a.irradiancia > b.irradiancia) {
      return 1;
    }
    return 0;
  }

  closeLeft() {
    this.sidenavLeft.close();
  }

  closeRight() {
    this.sidenavRight.close();
  }
}
