import { Component, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import Map from 'ol/Map';
import { defaults as defaultControls } from 'ol/control.js';
import { fromLonLat } from 'ol/proj';
import XYZ from 'ol/source/XYZ';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import VectorLayer from 'ol/layer/Vector';
import { click } from 'ol/events/condition';
import Select from 'ol/interaction/Select';

import { ComentariosControlService } from '@data/services/comentarios-control.service';
import { OlMapService } from '@data/services/ol-map.service';
import { ReportControlService } from '@data/services/report-control.service';
import { PlantaService } from '@data/services/planta.service';
import { AnomaliasControlService } from '@data/services/anomalias-control.service';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';
import { Anomalia } from '@core/models/anomalia';

@Component({
  selector: 'app-map-comments',
  templateUrl: './map-comments.component.html',
  styleUrls: ['./map-comments.component.css'],
})
export class MapCommentsComponent implements OnInit {
  private map: Map;
  private planta: PlantaInterface;
  private informe: InformeInterface;
  private thermalLayers: TileLayer[];
  private anomaliaLayers: VectorLayer[];
  private aerialLayers: TileLayer[];
  private anomaliaSelected: Anomalia;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private comentariosControlService: ComentariosControlService,
    private olMapService: OlMapService,
    private reportControlService: ReportControlService,
    private plantaService: PlantaService,
    private anomaliasControlService: AnomaliasControlService
  ) {}

  ngOnInit(): void {
    this.planta = this.reportControlService.planta;
    this.informe = this.reportControlService.informes.find(
      (inf) => inf.id === this.reportControlService.selectedInformeId
    );

    this.plantaService
      .getThermalLayers$(this.planta.id)
      .pipe(take(1))
      .subscribe(async (thermalLayers) => {
        // creamos las capas termica, visual y de anomalías para cada informe
        const thermalLayerDB = thermalLayers.find((item) => item.informeId === this.informe.id);

        if (thermalLayerDB !== undefined) {
          const thermalLayer = this.olMapService.createThermalLayer(thermalLayerDB, this.informe, 0);

          thermalLayer.setProperties({
            informeId: this.informe.id,
          });

          this.olMapService.addThermalLayer(thermalLayer);
        }

        // creamos la capa de anomalías
        this.olMapService.addAnomaliaLayer(this.anomaliasControlService.createCommentsAnomaliaLayers(this.informe.id));

        // añadimos las ortofotos aereas de cada informe
        await this.olMapService.addAerialLayer(this.informe);

        this.initMap();

        this.addSelectInteraction();
      });

    this.subscriptions.add(this.olMapService.getThermalLayers().subscribe((layers) => (this.thermalLayers = layers)));

    this.subscriptions.add(this.olMapService.aerialLayers$.subscribe((layers) => (this.aerialLayers = layers)));

    this.subscriptions.add(this.olMapService.getAnomaliaLayers().subscribe((layers) => (this.anomaliaLayers = layers)));
  }

  private initMap() {
    const satellite = new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: '',
    });
    const satelliteLayer = new TileLayer({
      source: satellite,
    });

    const layers = [satelliteLayer, ...this.aerialLayers /* , ...this.thermalLayers */];

    const view = new View({
      center: fromLonLat([this.planta.longitud, this.planta.latitud]),
      zoom: this.planta.zoom,
      minZoom: this.planta.zoom - 2,
      maxZoom: 24,
    });

    this.subscriptions.add(
      this.olMapService.createMap('map', layers, view, defaultControls({ attribution: false })).subscribe((map) => {
        this.map = map;
      })
    );

    // añadimos las capas de anomalías al mapa
    this.anomaliaLayers.forEach((l) => this.map.addLayer(l));

    // inicializamos el servicio que controla el comportamiento de las anomalias
    this.anomaliasControlService.initService().then((value) => {
      if (value) {
        this.anomaliasControlService.mostrarAnomalias(true);
      }
    });

    this.comentariosControlService.anomaliaSelected$.subscribe((anomalia) => (this.anomaliaSelected = anomalia));
  }

  openList() {
    this.comentariosControlService.listOpened = true;

    // this.comentariosControlService.vistaSelected = 'list';
  }

  private addSelectInteraction() {
    const select = new Select({
      condition: click,
    });

    select.setProperties({ id: 'selectAnomalia' });

    this.map.addInteraction(select);
    select.on('select', (e) => {
      if (e.selected.length > 0) {
        if (e.selected[0].getProperties().hasOwnProperty('properties')) {
          const anomaliaId = e.selected[0].getProperties().properties.anomaliaId;
          const anomalia = this.reportControlService.allAnomalias.find((anom) => anom.id === anomaliaId);

          this.comentariosControlService.anomaliaSelected = anomalia;

          this.comentariosControlService.infoOpened = true;
        }
      }
    });
  }
}
