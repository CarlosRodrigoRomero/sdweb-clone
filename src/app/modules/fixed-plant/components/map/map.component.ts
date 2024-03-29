import { Component, OnDestroy, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';
import { combineLatest, Subscription } from 'rxjs';

import Map from 'ol/Map';
import { fromLonLat, transformExtent } from 'ol/proj.js';
import View from 'ol/View';
import { OSM, TileDebug } from 'ol/source';
import TileLayer from 'ol/layer/Tile';
import { defaults as defaultControls } from 'ol/control.js';
import XYZ from 'ol/source/XYZ';
import VectorImageLayer from 'ol/layer/VectorImage';
import { Overlay } from 'ol';

import { PlantaService } from '@data/services/planta.service';
import { MapControlService } from '../../services/map-control.service';
import { OlMapService } from '@data/services/ol-map.service';
import { ShareReportService } from '@data/services/share-report.service';
import { AnomaliasControlService } from '@data/services/anomalias-control.service';
import { ReportControlService } from '@data/services/report-control.service';
import { DirtyAnomsService } from '@data/services/dirty-anoms.service';
import { ThermalService } from '@data/services/thermal.service';

import { PlantaInterface } from '@core/models/planta';
import { Anomalia } from '@core/models/anomalia';
import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { InformeInterface } from '@core/models/informe';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, OnDestroy {
  public planta: PlantaInterface;
  private informes: InformeInterface[];
  public map: Map;
  public rangeMin: number;
  public rangeMax: number;
  public palleteJSON: string;
  public selectedInformeId: string;
  public anomaliaSelect: Anomalia;
  public anomaliaHover: Anomalia;
  public sliderYear: number;
  public aerialLayers: TileLayer<any>[];
  private extent1: any;
  private osmLayer: TileLayer<any>;
  private satelliteLayer: TileLayer<any>;
  public thermalSource;
  private thermalLayersDB: ThermalLayerInterface[];
  private thermalLayers: TileLayer<any>[];
  private anomaliaLayers: VectorImageLayer<any>[];
  public leftOpened: boolean;
  public rightOpened: boolean;
  public statsOpened: boolean;
  public anomaliasLoaded = false;
  public mousePosition;
  public sharedReport = false;
  noAnomsReport = false;
  public coordsPointer;
  private popupDirty: Overlay;
  private popupAnomaliaInfo: Overlay;

  private subscriptions: Subscription = new Subscription();

  constructor(
    public mapControlService: MapControlService,
    private plantaService: PlantaService,
    private olMapService: OlMapService,
    private shareReportService: ShareReportService,
    private anomaliasControlService: AnomaliasControlService,
    private reportControlService: ReportControlService,
    private dirtyAnomsService: DirtyAnomsService,
    private thermalService: ThermalService
  ) {}

  ngOnInit(): void {
    this.mousePosition = null;

    this.anomaliasControlService.coordsPointer$.subscribe((coords) => (this.coordsPointer = coords));

    this.planta = this.reportControlService.planta;
    this.informes = this.reportControlService.informes;

    // Para la demo, agregamos un extent a todas las capas:
    this.extent1 = this.transform([-7.0608, 38.523619, -7.056351, 38.522765]);

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

            // solo lo aplicamos a la planta DEMO
            if (this.planta.id === 'egF0cbpXnnBnjcrusoeR') {
              thermalLayer.setExtent(this.extent1);
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

            this.addPopupOverlay();
            // añadimos las anomalías de suciedad por separado
            this.dirtyAnomsService.initService();
          }
        });
      });

    // asignamos los IDs necesarios para compartir
    this.shareReportService.setPlantaId(this.planta.id);

    this.subscriptions.add(this.olMapService.getThermalLayers().subscribe((layers) => (this.thermalLayers = layers)));

    this.subscriptions.add(this.olMapService.aerialLayers$.subscribe((layers) => (this.aerialLayers = layers)));

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId))
    );

    this.subscriptions.add(this.olMapService.getAnomaliaLayers().subscribe((layers) => (this.anomaliaLayers = layers)));

    this.subscriptions.add(this.reportControlService.noAnomsReport$.subscribe((value) => (this.noAnomsReport = value)));

    /* OSM */
    this.olMapService.addOSMLayer();
    this.subscriptions.add(this.olMapService.osmLayer$.subscribe((layer) => (this.osmLayer = layer)));

    /* SATELITE */
    this.olMapService.addSatelliteLayer();
    this.subscriptions.add(this.olMapService.satelliteLayer$.subscribe((layer) => (this.satelliteLayer = layer)));

    /* PALETA TÉRMICA */
    this.subscriptions.add(
      this.thermalService.paletteSelected$.subscribe((palette) => {
        this.olMapService.applyThermalPalette(palette);
      })
    );
  }

  initMap() {
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

      aerialLayer.setExtent(this.extent1);

      this.aerialLayers = [aerialLayer];
    }

    const layers = [
      this.osmLayer,
      this.satelliteLayer,
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

        this.subscriptions.add(
          combineLatest([
            this.anomaliasControlService.anomaliaHover$,
            this.anomaliasControlService.anomaliaSelect$,
          ]).subscribe(([anomHover, anomSelect]) => {
            this.anomaliaHover = anomHover;
            this.anomaliaSelect = anomSelect;
          })
        );
      }
    });

    // inicializamos el servicio que controla el comportamiento de las anomalías de suciedad
    this.dirtyAnomsService.initService().then((value) => {
      if (value) {
        this.informes.forEach((informe) => {
          // creamos la capa de suciedad para los diferentes informes
          this.dirtyAnomsService.createDirtyAnomsLayer(informe.id);

          // añadimos las anomalías de suciedad por separado
          this.dirtyAnomsService.addDirtyAnoms(informe.id);
        });
      }
    });
  }

  private addPopupOverlay() {
    const containerInfo = document.getElementById('popup-anomalia-info');

    this.popupAnomaliaInfo = new Overlay({
      id: 'popup-anomalia-info',
      element: containerInfo,
      position: undefined,
    });

    const containerDirty = document.getElementById('popup-dirty');

    this.popupDirty = new Overlay({
      id: 'popup-dirty',
      element: containerDirty,
      position: undefined,
    });
    this.map.addOverlay(this.popupAnomaliaInfo);
    this.map.addOverlay(this.popupDirty);
  }

  private transform(extent) {
    return transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
