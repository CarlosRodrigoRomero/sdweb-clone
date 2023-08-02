import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { SeguidorViewService } from '../../services/seguidor-view.service';
import { PcService } from '@data/services/pc.service';
import { AuthService } from '@data/services/auth.service';
import { ReportControlService } from '@data/services/report-control.service';
import { AnomaliaInfoService } from '@data/services/anomalia-info.service';
import { AnomaliaService } from '@data/services/anomalia.service';

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
  showComments = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private seguidorViewService: SeguidorViewService,
    private authService: AuthService,
    private pcService: PcService,
    private reportControlService: ReportControlService,
    private anomaliaInfoService: AnomaliaInfoService,
    private anomaliaService: AnomaliaService
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
            let numComentarios = null;
            if (this.anomaliaSelected.hasOwnProperty('comentarios') && this.anomaliaSelected.comentarios.length > 0) {
              numComentarios = this.anomaliaSelected.comentarios.length;
            }

            this.anomaliaInfo = {
              numAnom: this.anomaliaSelected.numAnom,
              clase: GLOBAL.labels_clase[this.anomaliaSelected.clase],
              claseColor: COLOR.colores_clase[this.anomaliaSelected.clase],
              temperaturaMax: this.anomaliaSelected.temperaturaMax,
              temperaturaRef: this.anomaliaSelected.temperaturaRef,
              gradienteNormalizado: this.anomaliaSelected.gradienteNormalizado,
              tipo: GLOBAL.pcDescripcion[this.anomaliaSelected.tipo],
              perdidas: this.anomaliaSelected.perdidas,
              causa: GLOBAL.pcCausa[this.anomaliaSelected.tipo],
              recomendacion: GLOBAL.pcRecomendacion[this.anomaliaSelected.tipo],
              fila: this.anomaliaInfoService.getAlturaAnom(this.anomaliaSelected, this.reportControlService.planta),
              columna: this.anomaliaInfoService.getColumnaAnom(this.anomaliaSelected, this.reportControlService.planta),
              fecha: this.fixNewTiffDates(this.anomaliaSelected.datetime),
              irradiancia: this.anomaliaSelected.irradiancia,
              // vientoDireccion: this.anomaliaSelected.vientoDireccion,
              // vientoVelocidad: this.anomaliaSelected.vientoVelocidad,
              viento: (this.anomaliaSelected as PcInterface).viento,
              temperaturaAire: (this.anomaliaSelected as PcInterface).temperaturaAire,
              nubosidad: (this.anomaliaSelected as PcInterface).nubosidad,
              numComentarios,
              localizacion: this.anomaliaInfoService.getPosicionModuloSeguidorLabel(
                this.anomaliaSelected,
                this.reportControlService.planta
              ),
            };
          }
        })
    );
  }

  private fixNewTiffDates(date: number): number {
    // quitamos 2 horas a las plantas de seguidores a partir de 2022 por el cambio de formato a TIFF
    const init2022 = 1640995200;
    const end2022 = 1672531200;
    if (!this.reportControlService.plantaFija && date > init2022 && date < end2022) {
      return date - 7200;
    }
    return date;
  }

  updateAnomalia(value: any, field: string) {
    // actualizamos la anomalía local
    this.anomaliaSelected[field] = Number(value);
    if (field === 'local_x') {
      this.anomaliaSelected.localX = Number(value);
    } else {
      this.anomaliaSelected.localY = Number(value);
    }

    const informeSelected = this.reportControlService.informes.find(
      (inf) => inf.id === this.anomaliaSelected.informeId
    );

    // comprobamos si se trata de un nuevo o antiguo informe de S2E
    if (informeSelected.fecha > GLOBAL.dateS2eAnomalias) {
      // actualizamos la anomalias en la DB
      this.anomaliaService.updateAnomalia(this.anomaliaSelected);
    } else {
      // actualizamos el PC en la DB
      this.pcService.updatePc(this.anomaliaSelected as PcInterface);
    }
  }

  showHideComments() {
    this.showComments = !this.showComments;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
