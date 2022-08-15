import { Component, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { Feature, Map } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Polygon from 'ol/geom/Polygon';
import { Fill, Stroke, Style, Text } from 'ol/style';

import { OlMapService } from '@data/services/ol-map.service';
import { ZonesService } from '@data/services/zones.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ZonesCommentControlService } from '@data/services/zones-comment-control.service';

import { LocationAreaInterface } from '@core/models/location';
import { InformeInterface } from '@core/models/informe';

@Component({
  selector: 'app-zones-comments',
  templateUrl: './zones-comments.component.html',
  styleUrls: ['./zones-comments.component.css'],
})
export class ZonesCommentsComponent implements OnInit {
  private smallZones: LocationAreaInterface[] = [];
  private bigZones: LocationAreaInterface[][] = [];
  private zonesLayers: VectorLayer[];
  private map: Map;
  public selectedInformeId: string;
  private informe: InformeInterface;
  public globalCoordAreasVectorSources: VectorSource[] = [];
  public globalCoordAreasVectorLayers: VectorLayer[] = [];

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private zonesService: ZonesService,
    private olMapService: OlMapService,
    private zonesCommentControlService: ZonesCommentControlService
  ) {}

  ngOnInit(): void {
    this.smallZones = this.zonesService.zonesBySize[this.zonesService.zonesBySize.length - 1];

    // quitamos las más pequeñas porque ya se muestran por defecto
    this.bigZones = this.zonesService.zonesBySize.filter((_, index, allZones) => index < allZones.length - 1);

    // iniciamos el servicio que controla las zonas y las cargamos
    this.zonesCommentControlService.initService().then((value) => {
      if (value) {
        this.zonesCommentControlService.mostrarSmallZones(this.smallZones, this.zonesLayers);
        this.zonesCommentControlService.addBigZones(this.bigZones);
      }
    });

    this.subscriptions.add(this.olMapService.zonasLayers$.subscribe((layers) => (this.zonesLayers = layers)));

    this.informe = this.reportControlService.informes[0];

    this.olMapService.addZoneLayer(this.zonesCommentControlService.createSmallZonesLayer(this.informe.id));

    this.olMapService.map$.subscribe((map) => {
      if (map !== undefined) {
        this.map = map;

        this.zonesLayers.forEach((l) => this.map.addLayer(l));
      }
    });
  }
}
