import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { SeguidorViewService } from '../../services/seguidor-view.service';
import { PcService } from '@data/services/pc.service';
import { AuthService } from '@data/services/auth.service';
import { ReportControlService } from '@data/services/report-control.service';

import { Anomalia } from '@core/models/anomalia';
import { PcInterface } from '@core/models/pc';

import { COLOR } from '@data/constants/color';
import { GLOBAL } from '@data/constants/global';

@Component({
  selector: 'app-seguidor-anomalia-info',
  templateUrl: './seguidor-anomalia-info.component.html',
  styleUrls: ['./seguidor-anomalia-info.component.css'],
})
export class SeguidorAnomaliaInfoComponent implements OnInit, OnDestroy {
  anomaliaSelected: Anomalia = undefined;
  anomaliaInfo = {};
  isAdmin = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private seguidorViewService: SeguidorViewService,
    private authService: AuthService,
    private pcService: PcService,
    private reportControlService: ReportControlService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.user$
        .pipe(
          take(1),
          switchMap((user) => {
            this.isAdmin = this.authService.userIsAdmin(user);

            return this.seguidorViewService.anomaliaSelected$;
          })
        )
        .subscribe((anom) => {
          this.anomaliaSelected = anom;

          if (this.anomaliaSelected !== undefined) {
            this.anomaliaInfo = {
              localId: this.anomaliaSelected.localId,
              clase: GLOBAL.labels_clase[this.anomaliaSelected.clase],
              claseColor: COLOR.colores_clase[this.anomaliaSelected.clase],
              temperaturaMax: this.anomaliaSelected.temperaturaMax,
              temperaturaRef: this.anomaliaSelected.temperaturaRef,
              gradienteNormalizado: this.anomaliaSelected.gradienteNormalizado,
              tipo: GLOBAL.pcDescripcion[this.anomaliaSelected.tipo],
              perdidas: this.anomaliaSelected.perdidas,
              causa: GLOBAL.pcCausa[this.anomaliaSelected.tipo],
              recomendacion: GLOBAL.pcRecomendacion[this.anomaliaSelected.tipo],
              fila: this.anomaliaSelected.localY,
              columna: this.anomaliaSelected.localX,
              fecha: this.fixNewTiffDates(this.anomaliaSelected.datetime),
              irradiancia: this.anomaliaSelected.irradiancia,
              // vientoDireccion: this.anomaliaSelected.vientoDireccion,
              // vientoVelocidad: this.anomaliaSelected.vientoVelocidad,
              viento: (this.anomaliaSelected as PcInterface).viento,
              temperaturaAire: (this.anomaliaSelected as PcInterface).temperaturaAire,
              nubosidad: (this.anomaliaSelected as PcInterface).nubosidad,
            };
          }
        })
    );
  }

  private fixNewTiffDates(date: number): number {
    // quitamos 2 horas a las plantas de seguidores a partir de 2022 por el cambio de formato a TIFF
    const init2022 = 1640995200;
    if (!this.reportControlService.plantaFija && date > init2022) {
      return date - 7200;
    }
  }

  updateAnomalia(value: any, field: string) {
    // actualizamos la anomalía local
    this.anomaliaSelected[field] = Number(value);
    if (field === 'local_x') {
      this.anomaliaSelected.localX = Number(value);
    } else {
      this.anomaliaSelected.localY = Number(value);
    }
    // actualizamos en la DB
    this.pcService.updatePc(this.anomaliaSelected as PcInterface);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
