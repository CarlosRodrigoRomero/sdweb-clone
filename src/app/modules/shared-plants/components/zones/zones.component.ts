import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import VectorLayer from 'ol/layer/Vector';
import { Map } from 'ol';

import { PlantaService } from '@data/services/planta.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ZonesService } from '@data/services/zones.service';
import { OlMapService } from '@data/services/ol-map.service';
import { ZonesControlService } from '@data/services/zones-control.service';
import { ViewReportService } from '@data/services/view-report.service';

import { LocationAreaInterface } from '@core/models/location';

@Component({
  selector: 'app-zones',
  templateUrl: './zones.component.html',
  styleUrls: ['./zones.component.css'],
})
export class ZonesComponent implements OnInit, OnDestroy {
  private zones: LocationAreaInterface[][] = [];
  private zonesLayers: VectorLayer[];
  private seguidorLayers: VectorLayer[];
  private map: Map;
  private viewSelected = 0;
  public selectedInformeId: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private plantaService: PlantaService,
    private reportControlService: ReportControlService,
    private zonesService: ZonesService,
    private olMapService: OlMapService,
    private zonesControlService: ZonesControlService,
    private viewReportService: ViewReportService
  ) {}

  ngOnInit(): void {
    this.plantaService
      .getLocationsArea(this.reportControlService.plantaId)
      .pipe(take(1))
      .subscribe((locAreas) => {
        this.zones = this.zonesService.getZonesBySize(this.reportControlService.planta, locAreas);

        // iniciamos el servicio que controla las zonas y las cargamos
        this.zonesControlService.initService().then((value) => {
          if (value) {
            this.zonesControlService.mostrarZonas(this.zones[this.zones.length - 1], this.zonesLayers);
          }
        });
      });

    this.subscriptions.add(this.olMapService.zonasLayers$.subscribe((layers) => (this.zonesLayers = layers)));

    // creamos las capas de zonas para los diferentes informes
    this.reportControlService.informes.forEach((informe) => {
      this.zonesControlService.createZonasLayers(informe.id).forEach((layer) => this.olMapService.addZoneLayer(layer));
    });

    this.olMapService.map$.subscribe((map) => {
      if (map !== undefined) {
        this.map = map;
        this.zonesLayers.forEach((l) => this.map.addLayer(l));
      }
    });

    this.viewReportService.reportViewSelected$.subscribe((value) => (this.viewSelected = 0));

    this.subscriptions.add(
      this.olMapService
        .getSeguidorLayers()
        .pipe(
          take(1),
          switchMap((layers) => {
            this.seguidorLayers = layers;

            return this.olMapService.currentZoom$;
          })
        )
        .subscribe((zoom) => {
          if (this.seguidorLayers !== undefined) {
            if (zoom >= this.zonesControlService.zoomChangeView) {
              this.seguidorLayers.forEach((l) => {
                if (
                  l.getProperties().view === this.viewSelected &&
                  l.getProperties().informeId === this.selectedInformeId
                ) {
                  l.setVisible(true);
                }
              });
            } else {
              this.seguidorLayers.forEach((l) => {
                if (
                  l.getProperties().view === this.viewSelected &&
                  l.getProperties().informeId === this.selectedInformeId
                ) {
                  l.setVisible(false);
                }
              });
            }
          }
        })
    );

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId))
    );

    this.subscriptions.add(this.olMapService.getSeguidorLayers().subscribe((layers) => (this.seguidorLayers = layers)));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
