import { Component, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { Map } from 'ol';
import VectorLayer from 'ol/layer/Vector';

import { ZonesControlService } from '@data/services/zones-control.service';
import { OlMapService } from '@data/services/ol-map.service';
import { ZonesService } from '@data/services/zones.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ZonesCommentControlService } from '@data/services/zones-comment-control.service';
import { ComentariosControlService } from '@data/services/comentarios-control.service';

import { LocationAreaInterface } from '@core/models/location';
import { InformeInterface } from '@core/models/informe';

@Component({
  selector: 'app-zones-comments',
  templateUrl: './zones-comments.component.html',
  styleUrls: ['./zones-comments.component.css'],
})
export class ZonesCommentsComponent implements OnInit {
  private zones: LocationAreaInterface[][] = [];
  private zonesLayers: VectorLayer[];
  private map: Map;
  public selectedInformeId: string;
  private informe: InformeInterface;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private zonesService: ZonesService,
    private olMapService: OlMapService,
    private zonesControlService: ZonesControlService,
    private zonesCommentControlService: ZonesCommentControlService,
    private comentariosControlService: ComentariosControlService
  ) {}

  ngOnInit(): void {
    this.zones = this.zonesService.zonesBySize;

    // iniciamos el servicio que controla las zonas y las cargamos
    this.zonesCommentControlService.initService().then((value) => {
      if (value) {
        this.zonesCommentControlService.mostrarZonas(this.zones[this.zones.length - 1], this.zonesLayers);
      }
    });

    this.subscriptions.add(this.olMapService.zonasLayers$.subscribe((layers) => (this.zonesLayers = layers)));

    this.informe = this.reportControlService.informes[0];

    // creamos las capas de zonas para los diferentes informes
    this.olMapService.addZoneLayer(this.zonesCommentControlService.createZonasLayer(this.informe.id));

    this.olMapService.map$.subscribe((map) => {
      if (map !== undefined) {
        this.map = map;
        this.zonesLayers.forEach((l) => this.map.addLayer(l));
      }
    });
  }
}
