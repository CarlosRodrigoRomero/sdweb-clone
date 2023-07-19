import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { ComentariosControlService } from '@data/services/comentarios-control.service';
import { AnomaliaInfoService } from '@data/services/anomalia-info.service';
import { ReportControlService } from '@data/services/report-control.service';
import { OlMapService } from '@data/services/ol-map.service';
import { ViewCommentsService } from '@data/services/view-comments.service';

import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';
import { Router } from '@angular/router';

interface AnomaliaInfo {
  numAnom: number;
  localizacion: string;
  tipo: string;
}

@Component({
  selector: 'app-anomalia-info',
  templateUrl: './anomalia-info.component.html',
  styleUrls: ['./anomalia-info.component.css'],
})
export class AnomaliaInfoComponent implements OnInit, AfterViewInit, OnDestroy {
  anomaliaSelected: Anomalia;
  anomaliaInfo: AnomaliaInfo = undefined;
  localizacion: string;
  seguidorSelected: Seguidor;
  plantaFija: boolean;
  isMobile = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private comentariosControlService: ComentariosControlService,
    private anomaliaInfoService: AnomaliaInfoService,
    private reportControlService: ReportControlService,
    private olMapService: OlMapService,
    private viewCommentsService: ViewCommentsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.router.url.includes('comments')) {
      this.isMobile = true;
    }

    this.plantaFija = this.reportControlService.plantaFija;

    this.subscriptions.add(
      this.comentariosControlService.anomaliaSelected$.subscribe((anom) => {
        this.anomaliaSelected = anom;

        if (this.anomaliaSelected !== undefined) {
          let localizacion: string;
          if (this.plantaFija) {
            localizacion = this.anomaliaInfoService.getLocalizacionCompleteTranslateLabel(
              this.anomaliaSelected,
              this.reportControlService.planta
            );
          } else {
            localizacion = this.anomaliaInfoService.getPosicionModuloLabel(
              this.anomaliaSelected,
              this.reportControlService.planta
            );
          }

          this.anomaliaInfo = {
            numAnom: this.anomaliaSelected.numAnom,
            localizacion,
            tipo: this.anomaliaInfoService.getTipoLabel(this.anomaliaSelected),
          };
        }
      })
    );

    this.subscriptions.add(
      this.comentariosControlService.seguidorSelected$.subscribe((seguidor) => (this.seguidorSelected = seguidor))
    );
  }

  ngAfterViewInit(): void {
    if (!this.plantaFija) {
      const position = document.getElementById('pos-map');
      if (position) {
        position.style.display = 'none';
      }
    }
  }

  goToAnomMap() {
    const coords = this.anomaliaSelected.featureCoords[0];
    const zoom = this.viewCommentsService.zoomChangeAnomsView;

    this.olMapService.setViewCenter(coords);
    this.olMapService.setViewZoom(zoom);

    this.comentariosControlService.infoOpened = false;
    this.comentariosControlService.listOpened = false;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
