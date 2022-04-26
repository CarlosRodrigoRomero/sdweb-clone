import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { catchError, switchMap, take } from 'rxjs/operators';

import { AnomaliaService } from '@core/services/anomalia.service';
import { InformeService } from '@core/services/informe.service';
import { PlantaService } from '@core/services/planta.service';
import { SeguidorService } from '@core/services/seguidor.service';

import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';
import { Anomalia } from '@core/models/anomalia';
import { LocationAreaInterface } from '@core/models/location';
import { HttpClient } from '@angular/common/http';

interface Warning {
  tipo: string;
  visible: boolean;
}

@Component({
  selector: 'app-check-warnings',
  templateUrl: './check-warnings.component.html',
  styleUrls: ['./check-warnings.component.css'],
})
export class CheckWarningsComponent implements OnInit {
  private informeId: string;
  private informe: InformeInterface;
  private planta: PlantaInterface;
  private anomalias: Anomalia[];
  private warnings: Warning[] = [];
  private locAreas: LocationAreaInterface[] = [];
  private seguidoresIndex = 0;

  constructor(
    private anomaliaService: AnomaliaService,
    private router: Router,
    private informeService: InformeService,
    private plantaService: PlantaService,
    private seguidorService: SeguidorService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.informeId = this.router.url.split('/')[this.router.url.split('/').length - 1];

    this.informeService
      .getInforme(this.informeId)
      .pipe(
        take(1),
        switchMap((informe) => {
          this.informe = informe;

          return this.plantaService.getPlanta(informe.plantaId);
        }),
        take(1),
        switchMap((planta) => {
          this.planta = planta;

          return this.plantaService.getLocationsArea(planta.id);
        })
      )
      .subscribe((locAreas) => {
        this.locAreas = locAreas;

        // indice que corresponde a los seguidores en las globalCoords
        this.seguidoresIndex = this.seguidorService.getIndiceGlobalCoordsSeguidores(locAreas);

        this.anomaliaService.initService(this.planta.id).then(() => {
          this.anomaliaService.getAnomalias$(this.informeId, 'pcs').subscribe((anoms) => {
            this.anomalias = this.anomaliaService.getRealAnomalias(anoms);

            this.checkWanings();
          });
        });
      });
  }

  private checkWanings() {
    this.warnings = [];

    this.checkTiposAnoms();
    this.checkNumsCoA();
    this.checkNumsCriticidad();
    this.checkFilsColsPlanta();
    this.checkFilColAnoms();
    this.checkZonesWarnings();
    this.checkAerialLayer();
  }

  private addWarning(warning: Warning) {
    if (!this.warnings.map((warn) => warn.tipo).includes(warning.tipo)) {
      this.warnings.push(warning);
    }
  }

  private checkTiposAnoms() {
    if (this.informe !== undefined && this.anomalias.length > 0) {
      if (this.informe.tiposAnomalias.length > 0) {
        const sumTiposAnoms = this.informe.tiposAnomalias.reduce((acum, curr, index) => {
          // las celulas calientes son un array por separado
          if (index === 8 || index === 9) {
            return acum + curr.reduce((a, c) => a + c);
          } else {
            return acum + curr;
          }
        });

        if (this.anomalias.length !== sumTiposAnoms) {
          const warning: Warning = {
            tipo: 'tiposAnom',
            visible: true,
          };

          this.addWarning(warning);
        }
      } else {
        const warning: Warning = {
          tipo: 'tiposAnom',
          visible: true,
        };

        this.addWarning(warning);
      }
    }
  }

  private checkNumsCoA() {
    if (this.informe !== undefined && this.anomalias.length > 0) {
      const sumNumsCoA = this.informe.numsCoA.reduce((acum, curr) => acum + curr);

      if (this.anomalias.length !== sumNumsCoA) {
        const warning: Warning = {
          tipo: 'numsCoA',
          visible: true,
        };

        this.addWarning(warning);
      }
    }
  }

  private checkNumsCriticidad() {
    if (this.informe !== undefined && this.anomalias.length > 0) {
      const sumNumsCriticidad = this.informe.numsCriticidad.reduce((acum, curr) => acum + curr);

      if (this.anomalias.length !== sumNumsCriticidad) {
        const warning: Warning = {
          tipo: 'numsCriticidad',
          visible: true,
        };

        this.addWarning(warning);
      }
    }
  }

  private checkFilsColsPlanta() {
    if (this.planta.columnas <= 1 || this.planta.columnas === undefined || this.planta.columnas === null) {
      const warning: Warning = {
        tipo: 'filsColsPlanta',
        visible: true,
      };

      this.addWarning(warning);
    }
  }

  private checkFilColAnoms() {
    // primero comprobamos que el nº de filas y columnas de la planta sean correctos
    if (this.planta.columnas > 1 && this.planta.columnas !== undefined && this.planta.columnas !== null) {
      const differentFilColAnoms = this.anomalias.filter(
        (anom) => anom.localY > this.planta.filas || anom.localX > this.planta.columnas
      );

      if (differentFilColAnoms.length > 0) {
        const warning: Warning = {
          tipo: 'filsColsAnoms',
          visible: true,
        };

        this.addWarning(warning);
      }
    }
  }

  private checkZonesWarnings() {
    if (this.locAreas.length > 0) {
      this.checkWrongLocationAnoms();
      this.checkNoGlobalCoordsAnoms();
      this.checkZonesNames();
      this.checkModulosWarnings();
    } else {
      // añadimos el aviso de que faltan las zonas de la planta
      const warning: Warning = {
        tipo: 'noLocAreas',
        visible: true,
      };

      this.addWarning(warning);
    }
  }

  private checkWrongLocationAnoms() {
    let anomsWrongGlobals: Anomalia[];

    anomsWrongGlobals = this.anomalias.filter((anom) => anom.globalCoords[this.seguidoresIndex] === null);

    if (anomsWrongGlobals.length > 0) {
      const warning: Warning = {
        tipo: 'wrongLocAnoms',
        visible: true,
      };

      this.addWarning(warning);
    }
  }

  private checkNoGlobalCoordsAnoms() {
    const noGlobalCoordsAnoms = this.anomalias.filter(
      (anom) => anom.globalCoords === null || anom.globalCoords === undefined || anom.globalCoords[0] === null
    );

    if (noGlobalCoordsAnoms.length > 0) {
      const warning: Warning = {
        tipo: 'noGlobalCoordsAnoms',
        visible: true,
      };

      this.addWarning(warning);
    }
  }

  private checkZonesNames() {
    if (
      !this.planta.hasOwnProperty('nombreGlobalCoords') ||
      this.planta.nombreGlobalCoords === null ||
      this.planta.nombreGlobalCoords === undefined ||
      this.planta.nombreGlobalCoords.length === 0
    ) {
      const warning: Warning = {
        tipo: 'nombresZonas',
        visible: true,
      };

      this.addWarning(warning);
    }
  }

  private checkModulosWarnings() {
    const areasConModulo = this.locAreas.filter(
      (locArea) => locArea.hasOwnProperty('modulo') && locArea.modulo !== null && locArea.modulo !== undefined
    );

    if (areasConModulo.length > 0) {
      this.checkModulosAnoms();
    } else {
      // añadimos el aviso de que faltan los modulos de la planta
      const warning: Warning = {
        tipo: 'modulosPlanta',
        visible: true,
      };

      this.addWarning(warning);
    }
  }

  private checkModulosAnoms() {
    const anomsSinModulo = this.anomalias.filter((anom) => anom.modulo === null || anom.modulo === undefined);

    if (anomsSinModulo.length > 0) {
      const warning: Warning = {
        tipo: 'modulosAnoms',
        visible: true,
      };

      this.addWarning(warning);
    }
  }

  private checkAerialLayer() {
    const url = 'https://solardrontech.es/tileserver.php?/index.json?/' + this.informe.id + '_visual/1/1/1.png';

    this.http
      .get(url)
      .pipe(
        take(1),
        catchError((error) => {
          // no recibimos respuesta del servidor porque no existe
          if (error.status === 0) {
            const warning: Warning = {
              tipo: 'visualLayer',
              visible: true,
            };

            this.addWarning(warning);
          }

          return [];
        }),
        take(1)
      )
      .subscribe((data) => console.log(''));
  }
}
