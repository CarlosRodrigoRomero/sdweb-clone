import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';
import { skip, take } from 'rxjs/operators';

import TileLayer from 'ol/layer/Tile';
import VectorImageLayer from 'ol/layer/VectorImage';

import { OlMapService } from '@data/services/ol-map.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ViewReportService } from '@data/services/view-report.service';
import { ZonesControlService } from '@data/services/zones-control.service';
import { ZonesService } from '@data/services/zones.service';
import { DirtyAnomsService } from '@data/services/dirty-anoms.service';

@Component({
  selector: 'app-view-control',
  templateUrl: './view-control.component.html',
  styleUrls: ['./view-control.component.css'],
})
export class ViewControlComponent implements OnInit, OnDestroy {
  private aerialLayers: TileLayer<any>[];
  private thermalLayers: TileLayer<any>[];
  private anomaliaLayers: VectorImageLayer<any>[];
  private dirtyAnomsLayers: VectorImageLayer<any>[];
  private seguidorLayers: VectorImageLayer<any>[];
  private zonesLayers: VectorImageLayer<any>[];
  public selectedInformeId: string;
  private reportViewSelected: string;
  private currentZoom: number;
  private viewZones: boolean;
  private thermalLayerVisible: boolean;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private olMapService: OlMapService,
    private reportControlService: ReportControlService,
    private viewReportService: ViewReportService,
    private zonesControlService: ZonesControlService,
    private zonesService: ZonesService,
    private dirtyAnomsService: DirtyAnomsService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(this.olMapService.aerialLayers$.subscribe((layers) => (this.aerialLayers = layers)));

    if (this.reportControlService.plantaNoS2E) {
      this.subscriptions.add(this.olMapService.thermalLayers$.subscribe((layers) => (this.thermalLayers = layers)));

      this.subscriptions.add(
        this.olMapService.getAnomaliaLayers().subscribe((layers) => (this.anomaliaLayers = layers))
      );

      this.subscriptions.add(
        this.dirtyAnomsService.dirtyAnomsLayers$.subscribe((layers) => (this.dirtyAnomsLayers = layers))
      );
    } else {
      this.subscriptions.add(
        this.olMapService.getSeguidorLayers().subscribe((layers) => (this.seguidorLayers = layers))
      );
    }

    this.subscriptions.add(this.olMapService.zonasLayers$.subscribe((layers) => (this.zonesLayers = layers)));

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => {
        this.selectedInformeId = informeId;

        this.setLayersVisibility(this.selectedInformeId);
      })
    );

    this.subscriptions.add(
      this.viewReportService.reportViewSelected$.subscribe((view) => {
        this.reportViewSelected = view;

        this.setLayersVisibility(this.selectedInformeId);
      })
    );

    if (this.zonesService.thereAreZones) {
      this.subscriptions.add(
        this.olMapService.currentZoom$.subscribe((zoom) => {
          this.currentZoom = zoom;

          this.setLayersVisibility(this.selectedInformeId);
        })
      );
    }

    // checkbox ver u ocultar zonas
    this.subscriptions.add(
      this.viewReportService.groupByZonesView$.subscribe((view) => {
        this.viewZones = view;

        this.setLayersVisibility(this.selectedInformeId);
      })
    );

    // establecemos las visibilidades de inicio cuando el mapa ha cargado
    this.subscriptions.add(
      this.reportControlService.mapLoaded$.subscribe((loaded) => {
        if (loaded) {
          this.setLayersVisibility(this.selectedInformeId);
        }
      })
    );

    /* CAPA TÉRMICA */
    this.subscriptions.add(
      this.viewReportService.thermalLayerVisible$.subscribe((visible) => {
        this.thermalLayerVisible = visible;

        this.setLayersVisibility(this.selectedInformeId);
      })
    );
  }

  private setLayersVisibility(informeId: string) {
    this.setAerialLayersVisibility(informeId);

    if (this.zonesService.thereAreZones) {
      this.setZonesLayersVisibility(informeId);
    }

    if (this.reportControlService.plantaNoS2E !== undefined) {
      if (this.reportControlService.plantaNoS2E) {
        this.setThermalLayersVisibility(informeId);
        this.setAnomaliaLayersVisibility(informeId);
        this.setDirtyAnomsLayersVisibility(informeId);
      } else {
        this.setSeguidorLayersVisibility(informeId);
      }
    }
  }

  private setDirtyAnomsLayersVisibility(informeId: string) {
    this.dirtyAnomsLayers.forEach((layer) => {
      if (layer !== null) {
        if (layer.getProperties().informeId === informeId) {
          if (this.currentZoom >= this.dirtyAnomsService.zoomChangeView) {
            layer.setVisible(true);
          } else {
            layer.setVisible(false);
          }
        } else {
          layer.setVisible(false);
        }
      }
    });
  }

  private setAerialLayersVisibility(informeId: string) {
    this.aerialLayers.forEach((layer) => {
      if (layer !== null) {
        if (layer.getProperties().informeId === informeId) {
          layer.setVisible(true);
        } else {
          layer.setVisible(false);
        }
      }
    });
  }

  private setThermalLayersVisibility(informeId: string) {
    this.thermalLayers.forEach((layer) => {
      if (layer.getProperties().informeId === informeId) {
        layer.setVisible(this.thermalLayerVisible);
      } else {
        layer.setVisible(false);
      }
    });
  }

  private setAnomaliaLayersVisibility(informeId: string) {
    this.anomaliaLayers.forEach((layer) => {
      if (layer.getProperties().informeId === informeId && layer.getProperties().view === this.reportViewSelected) {
        // vista tipo anomalías
        if (layer.getProperties().view === 'tipo') {
          layer.setVisible(true);
        } else {
          if (this.zonesService.thereAreZones && this.viewZones) {
            if (this.currentZoom >= this.zonesControlService.zoomChangeView) {
              layer.setVisible(true);
            } else {
              layer.setVisible(false);
            }
          } else {
            layer.setVisible(true);
          }
        }
      } else {
        layer.setVisible(false);
      }
    });
  }

  private setSeguidorLayersVisibility(informeId: string) {
    this.seguidorLayers.forEach((layer) => {
      if (layer.getProperties().informeId === informeId && layer.getProperties().view === this.reportViewSelected) {
        if (this.zonesService.thereAreZones && this.viewZones) {
          if (this.currentZoom >= this.zonesControlService.zoomChangeView) {
            layer.setVisible(true);
          } else {
            layer.setVisible(false);
          }
        } else {
          layer.setVisible(true);
        }
      } else {
        layer.setVisible(false);
      }
    });
  }

  private setZonesLayersVisibility(informeId: string) {
    if (this.zonesLayers.length) {
      this.zonesLayers.forEach((layer) => {
        if (
          layer.getProperties().informeId === informeId &&
          layer.getProperties().view === this.reportViewSelected &&
          this.viewZones
        ) {
          layer.setVisible(true);
        } else {
          layer.setVisible(false);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
