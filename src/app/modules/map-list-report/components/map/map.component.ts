import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat, transformExtent } from 'ol/proj';
import { OSM, XYZ } from 'ol/source';
import { defaults as defaultControls } from 'ol/control.js';
import { Extent } from 'ol/extent';
import VectorImageLayer from 'ol/layer/VectorImage';
import Map from 'ol/Map';

import { PlantaService } from '@data/services/planta.service';
import { OlMapService } from '@data/services/ol-map.service';
import { ShareReportService } from '@data/services/share-report.service';
import { AnomaliasControlService } from '@data/services/anomalias-control.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ThermalService } from '@data/services/thermal.service';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';
import { ThermalLayerInterface } from '@core/models/thermalLayer';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit, OnDestroy {
  private planta: PlantaInterface;
  private informes: InformeInterface[];
  private extentDemo: Extent;
  private thermalLayersDB: ThermalLayerInterface[];
  private thermalLayers: TileLayer[];
  private aerialLayers: TileLayer[];
  private anomaliaLayers: VectorImageLayer[];
  noAnomsReport = false;
  private map: Map;
  selectedInformeId: string;
  thermalLayersLoaded = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private plantaService: PlantaService,
    private olMapService: OlMapService,
    private shareReportService: ShareReportService,
    private anomaliasControlService: AnomaliasControlService,
    private reportControlService: ReportControlService,
    private thermalService: ThermalService
  ) {}

  ngOnInit(): void {
    this.planta = this.reportControlService.planta;
    this.informes = this.reportControlService.informes;

    // Para la demo, agregamos un extent a todas las capas:
    this.extentDemo = this.transform([-7.0608, 38.523619, -7.056351, 38.522765]);

    this.plantaService
      .getThermalLayers$(this.planta.id)
      .pipe(take(1))
      .subscribe((layers) => {
        this.thermalLayersDB = layers;

        // Para cada informe, hay que crear 2 capas: térmica y vectorial
        this.informes.forEach(async (informe, index) => {
          const thermalLayerDB = this.thermalLayersDB.find((item) => item.informeId === informe.id);

          if (thermalLayerDB !== undefined) {
            const thermalLayer = this.olMapService.createThermalLayer(thermalLayerDB, informe, index);

            thermalLayer.setProperties({
              informeId: informe.id,
            });

            // solo lo aplicamos a la planta DEMO
            if (this.planta.id === 'egF0cbpXnnBnjcrusoeR') {
              thermalLayer.setExtent(this.extentDemo);
            }

            this.olMapService.addThermalLayer(thermalLayer);
          }

          // creamos las capas de anomalías para los diferentes informes o zonas
          this.anomaliasControlService
            .createAnomaliaLayers(informe.id)
            .forEach((layer) => this.olMapService.addAnomaliaLayer(layer));

          // añadimos las ortofotos aereas de cada informe
          await this.olMapService.addAerialLayer(informe);

          if (index === this.informes.length - 1) {
            this.initMap();
          }
        });
      });

    // asignamos los IDs necesarios para compartir
    this.shareReportService.setPlantaId(this.planta.id);

    this.subscriptions.add(this.olMapService.getThermalLayers().subscribe((layers) => (this.thermalLayers = layers)));

    this.subscriptions.add(this.olMapService.aerialLayers$.subscribe((layers) => (this.aerialLayers = layers)));

    this.subscriptions.add(this.olMapService.getAnomaliaLayers().subscribe((layers) => (this.anomaliaLayers = layers)));

    this.subscriptions.add(this.reportControlService.noAnomsReport$.subscribe((value) => (this.noAnomsReport = value)));

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((id) => (this.selectedInformeId = id))
    );

    this.subscriptions.add(
      this.thermalService.thermalLayersLoaded$.subscribe((value) => (this.thermalLayersLoaded = value))
    );
  }

  initMap() {
    const satellite = new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: '',
    });
    const satelliteLayer = new TileLayer({
      source: satellite,
      preload: Infinity,
    });

    const osmLayer = new TileLayer({
      source: new OSM(),
    });

    let aerial;
    // solo lo aplicamos a la planta DEMO
    if (this.planta.id === 'egF0cbpXnnBnjcrusoeR') {
      aerial = new XYZ({
        url: 'https://solardrontech.es/demo_rgb/{z}/{x}/{y}.png',
        crossOrigin: '',
      });

      const aerialLayer = new TileLayer({
        source: aerial,
        preload: Infinity,
      });

      aerialLayer.setExtent(this.extentDemo);

      this.aerialLayers = [aerialLayer];
    }

    const layers = [
      // osmLayer,
      satelliteLayer,
      ...this.aerialLayers,
      ...this.thermalLayers,
      // new TileLayer({
      //   source: new TileDebug(),
      // }),
    ];

    // MAPA
    let view: View;

    if (this.planta.id === 'egF0cbpXnnBnjcrusoeR') {
      // solo lo aplicamos a la planta DEMO
      view = new View({
        center: fromLonLat([this.planta.longitud, this.planta.latitud]),
        zoom: 18,
        minZoom: 16,
        maxZoom: 24,
        extent: this.transform([-7.060903, 38.523993, -7.0556, 38.522264]),
      });
    } else {
      view = new View({
        center: fromLonLat([this.planta.longitud, this.planta.latitud]),
        zoom: this.planta.zoom,
        minZoom: this.planta.zoom - 2,
        maxZoom: 24,
      });
    }

    this.subscriptions.add(
      this.olMapService.createMap('map', layers, view, defaultControls({ attribution: false })).subscribe((map) => {
        this.map = map;

        if (this.map !== undefined) {
          // añadimos el evento de inicio de movimiento al mapa
          this.olMapService.addMoveStartEvent();

          this.map.once('postrender', () => (this.reportControlService.mapLoaded = true));
        }
      })
    );

    // añadimos las capas de anomalías al mapa
    this.anomaliaLayers.forEach((l) => this.map.addLayer(l));

    // inicializamos el servicio que controla el comportamiento de las anomalias
    this.anomaliasControlService.initService().then((value) => {
      if (value) {
        this.anomaliasControlService.mostrarAnomalias();
      }
    });
  }

  private transform(extent) {
    return transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
