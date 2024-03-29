import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { Map } from 'ol';
import VectorImageLayer from 'ol/layer/VectorImage';

import { ReportControlService } from '@data/services/report-control.service';
import { ZonesService } from '@data/services/zones.service';
import { OlMapService } from '@data/services/ol-map.service';
import { ZonesControlService } from '@data/services/zones-control.service';

import { LocationAreaInterface } from '@core/models/location';

@Component({
  selector: 'app-zones',
  templateUrl: './zones.component.html',
  styleUrls: ['./zones.component.css'],
})
export class ZonesComponent implements OnInit, OnDestroy {
  private zones: LocationAreaInterface[][] = [];
  private zonesLayers: VectorImageLayer<any>[];
  private map: Map;
  public selectedInformeId: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private zonesService: ZonesService,
    private olMapService: OlMapService,
    private zonesControlService: ZonesControlService
  ) {}

  ngOnInit(): void {
    this.zones = this.zonesService.zonesBySize;

    // iniciamos el servicio que controla las zonas y las cargamos
    this.zonesControlService.initService().then((value) => {
      if (value) {
        let sizeZonesClusters = this.zones.length - 1;
        // si tiene un tamaño de agrupación por zonas seleccionado lo aplicamos
        if (this.reportControlService.planta.hasOwnProperty('sizeZonesClusters')) {
          sizeZonesClusters = this.reportControlService.planta.sizeZonesClusters;
        }
        const newZones = this.zonesControlService.createZonas(this.zones[sizeZonesClusters]);

        this.zonesControlService.mostrarZonas(newZones, this.zonesLayers);
      }
    });

    this.subscriptions.add(this.olMapService.zonasLayers$.subscribe((layers) => (this.zonesLayers = layers)));

    // creamos las capas de zonas para los diferentes informes
    this.reportControlService.informes.forEach((informe) => {
      this.zonesControlService.createZonasLayers(informe.id).forEach((layer) => this.olMapService.addZoneLayer(layer));
    });

    this.subscriptions.add(
      this.olMapService.map$.subscribe((map) => {
        if (map !== undefined) {
          this.map = map;
          this.zonesLayers.forEach((l) => {
            this.map.addLayer(l);
          });
        }
      })
    );

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
