import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { catchError, switchMap, take } from 'rxjs/operators';

import { AnomaliaService } from '@core/services/anomalia.service';
import { InformeService } from '@core/services/informe.service';
import { PlantaService } from '@core/services/planta.service';
import { SeguidorService } from '@core/services/seguidor.service';
import { WarningService } from '@core/services/warning.service';

import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';
import { Anomalia } from '@core/models/anomalia';
import { LocationAreaInterface } from '@core/models/location';
import { Warning } from '@shared/components/warnings-menu/warnings';

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
    private http: HttpClient,
    private warningService: WarningService
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

            // this.checkWanings();
          });
        });
      });

    this.warningService.getWarnings(this.informeId).subscribe((warnings) => (this.warnings = warnings));
  }

  checkWarnings() {
    this.warningService.checkTiposAnoms(this.informe, this.anomalias, this.warnings);
    this.warningService.checkNumsCoA(this.informe, this.anomalias, this.warnings);
    this.warningService.checkNumsCriticidad(this.informe, this.anomalias, this.warnings);
    this.warningService.checkFilsColsPlanta(this.planta, this.informe, this.warnings);
    this.checkFilColAnoms();
    this.checkZonesWarnings();
    this.checkAerialLayer();
  }

  private addWarning(warning: Warning) {
    if (!this.warnings.map((warn) => warn.type).includes(warning.type)) {
      this.warningService.addWarning(this.informeId, warning);
    }
  }

  private checkOldWarning(type: string) {
    const oldWarning = this.warnings.find((warn) => warn.type === type);

    if (oldWarning) {
      this.warningService.deleteWarning(this.informeId, oldWarning.id);
    }
  }

  private checkNumsCriticidad() {
    if (this.informe !== undefined && this.anomalias.length > 0) {
      if (this.informe.numsCriticidad.length > 0) {
        const sumNumsCriticidad = this.informe.numsCriticidad.reduce((acum, curr) => acum + curr);

        if (this.anomalias.length !== sumNumsCriticidad) {
          const warning: Warning = {
            type: 'sumNumsCriticidad',
            visible: true,
          };

          this.addWarning(warning);
        }
      } else {
        const warning: Warning = {
          type: 'numsCriticidad',
          visible: true,
        };

        this.addWarning(warning);
      }
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
          type: 'filsColsAnoms',
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
        type: 'noLocAreas',
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
        type: 'wrongLocAnoms',
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
        type: 'noGlobalCoordsAnoms',
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
        type: 'nombresZonas',
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
        type: 'modulosPlanta',
        visible: true,
      };

      this.addWarning(warning);
    }
  }

  private checkModulosAnoms() {
    const anomsSinModulo = this.anomalias.filter((anom) => anom.modulo === null || anom.modulo === undefined);

    if (anomsSinModulo.length > 0) {
      const warning: Warning = {
        type: 'modulosAnoms',
        visible: true,
      };

      this.addWarning(warning);
    }
  }

  private checkAerialLayer() {
    const url = 'https://solardrontech.es/tileserver.php?/index.json?/' + this.informeId + '_visual/1/1/1.png';

    this.http
      .get(url)
      .pipe(
        take(1),
        catchError((error) => {
          // no recibimos respuesta del servidor porque no existe
          if (error.status === 0) {
            const warning: Warning = {
              type: 'visualLayer',
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
