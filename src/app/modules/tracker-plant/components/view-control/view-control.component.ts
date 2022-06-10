import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';

import { OlMapService } from '@data/services/ol-map.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ViewReportService } from '@data/services/view-report.service';
import { ZonesControlService } from '@data/services/zones-control.service';

@Component({
  selector: 'app-view-control',
  templateUrl: './view-control.component.html',
  styleUrls: ['./view-control.component.css'],
})
export class ViewControlComponent implements OnInit, OnDestroy {
  private aerialLayers: TileLayer[];
  private seguidorLayers: VectorLayer[];
  public selectedInformeId: string;
  private reportViewSelected: number;
  private currentZoom: number;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private olMapService: OlMapService,
    private reportControlService: ReportControlService,
    private viewReportService: ViewReportService,
    private zonesControlService: ZonesControlService
  ) {}

  ngOnInit(): void {
    this.olMapService.aerialLayers$.pipe(take(1)).subscribe((layers) => (this.aerialLayers = layers));

    this.olMapService
      .getSeguidorLayers()
      .pipe(take(1))
      .subscribe((layers) => (this.seguidorLayers = layers));

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => {
        this.selectedInformeId = informeId;

        this.setAerialLayersOpacity(this.selectedInformeId);
        this.setSeguidorLayersOpacity(this.selectedInformeId);
      })
    );

    this.subscriptions.add(
      this.viewReportService.reportViewSelected$.subscribe((view) => {
        this.reportViewSelected = view;

        this.setAerialLayersOpacity(this.selectedInformeId);
        this.setSeguidorLayersOpacity(this.selectedInformeId);
      })
    );

    this.subscriptions.add(this.olMapService.currentZoom$.subscribe((zoom) => (this.currentZoom = zoom)));
  }

  private setAerialLayersOpacity(informeId: string) {
    this.aerialLayers.forEach((layer) => {
      if (layer.getProperties().informeId === informeId) {
        layer.setVisible(true);
      } else {
        layer.setVisible(false);
      }
    });
  }

  private setSeguidorLayersOpacity(informeId: string) {
    this.seguidorLayers.forEach((layer) => {
      if (
        layer.getProperties().informeId === informeId &&
        layer.getProperties().view === this.reportViewSelected &&
        this.currentZoom >= this.zonesControlService.zoomChangeView
      ) {
        layer.setVisible(true);
      } else {
        layer.setVisible(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
