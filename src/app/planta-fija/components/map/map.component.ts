import { Component, OnDestroy, OnInit } from '@angular/core';

import { switchMap, take } from 'rxjs/operators';
import { combineLatest, Subscription } from 'rxjs';

import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import { fromLonLat, transformExtent } from 'ol/proj.js';
import View from 'ol/View';
import { Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { defaults as defaultControls } from 'ol/control.js';
import XYZ from 'ol/source/XYZ';

import ImageTileMod from '@shared/modules/ol-maps/ImageTileMod.js';
import XYZ_mod from '@shared/modules/ol-maps/xyz_mod.js';

import { PlantaService } from '@core/services/planta.service';
import { MapControlService } from '../../services/map-control.service';
import { GLOBAL } from '@core/services/global';
import { InformeService } from '@core/services/informe.service';
import { FilterService } from '@core/services/filter.service';
import { OlMapService } from '@core/services/ol-map.service';
import { ShareReportService } from '@core/services/share-report.service';
import { AnomaliasControlService } from '../../services/anomalias-control.service';
import { ReportControlService } from '@core/services/report-control.service';
import { ThermalService } from '@core/services/thermal.service';

import { PlantaInterface } from '@core/models/planta';
import { Anomalia } from '@core/models/anomalia';
import { ThermalLayerInterface } from '@core/models/thermalLayer';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, OnDestroy {
  public plantaId: string;
  public planta: PlantaInterface;
  public map: Map;
  public rangeMin: number;
  public rangeMax: number;
  public palleteJSON: string;
  public selectedInformeId: string;
  public anomaliaSelect: Anomalia;
  public anomaliaHover: Anomalia;
  public listaAnomalias: Anomalia[];
  public sliderYear: number;
  public aerialLayer: TileLayer;
  private extent1: any;
  public thermalSource;
  private thermalLayers: TileLayer[];
  private anomaliaLayers: VectorLayer[];
  public leftOpened: boolean;
  public rightOpened: boolean;
  public statsOpened: boolean;
  public anomaliasLoaded = false;
  public mousePosition;
  public informeIdList: string[] = [];
  public sharedReport = false;
  private subscriptions: Subscription = new Subscription();

  constructor(
    public mapControlService: MapControlService,
    private plantaService: PlantaService,
    private informeService: InformeService,
    public filterService: FilterService,
    private olMapService: OlMapService,
    private shareReportService: ShareReportService,
    private anomaliasControlService: AnomaliasControlService,
    private reportControlService: ReportControlService,
    private thermalService: ThermalService
  ) {}

  ngOnInit(): void {
    this.mousePosition = null;

    // Para la demo, agregamos un extent a todas las capas:
    this.extent1 = this.transform([-7.0608, 38.523619, -7.056351, 38.522765]);

    // this.plantaId = 'egF0cbpXnnBnjcrusoeR';
    this.subscriptions.add(
      this.reportControlService.plantaId$
        .pipe(
          take(1),
          switchMap((plantaId) => {
            this.plantaId = plantaId;

            // Obtenemos todas las capas para esta planta
            return combineLatest([
              this.plantaService.getThermalLayers$(this.plantaId),
              this.informeService.getInformesDePlanta(this.plantaId),
              this.plantaService.getPlanta(this.plantaId),
            ]);
          })
        )
        .pipe(
          take(1),
          switchMap(([thermalLayers, informes, planta]) => {
            // ordenamos los informes por fecha
            this.informeIdList = informes.sort((a, b) => a.fecha - b.fecha).map((informe) => informe.id);

            // Para cada informe, hay que crear 2 capas: térmica y vectorial
            informes
              .sort((a, b) => a.fecha - b.fecha)
              .forEach((informe) => {
                const tl = thermalLayers.find((item) => item.informeId === informe.id);

                // TODO: Comprobar que existe...
                if (tl !== undefined) {
                  this.olMapService.addThermalLayer(this._createThermalLayer(tl, informe.id));
                }

                // creamos las capas de anomalías para los diferentes informes
                this.olMapService.addAnomaliaLayer(this._createAnomaliaLayer(informe.id));
              });

            this.planta = planta;

            // asignamos los IDs necesarios para compartir
            this.shareReportService.setPlantaId(this.plantaId);

            return combineLatest([
              this.olMapService.getThermalLayers(),
              this.olMapService.getAnomaliaLayers(),
              this.reportControlService.selectedInformeId$,
            ]);
          })
        )
        .subscribe(([therLayers, anomLayers, informeId]) => {
          if (this.anomaliaLayers === undefined) {
            // nos suscribimos a las capas termica y de anomalias
            this.thermalLayers = therLayers;
            this.anomaliaLayers = anomLayers;
          }

          // nos suscribimos al informe seleccionado
          this.selectedInformeId = informeId;

          if (this.map === undefined) {
            this.initMap();
          }
        })
    );
  }

  private _createThermalLayer(thermalLayer: ThermalLayerInterface, informeId: string): TileLayer {
    // Iniciar mapa térmico
    const tl = new TileLayer({
      source: new XYZ_mod({
        url: GLOBAL.GIS + thermalLayer.gisName + '/{z}/{x}/{y}.png',
        crossOrigin: '',
        tileClass: ImageTileMod,
        transition: 255,
        tileLoadFunction: (imageTile, src) => {
          imageTile.rangeTempMax = thermalLayer.rangeTempMax;
          imageTile.rangeTempMin = thermalLayer.rangeTempMin;
          imageTile.thermalService = this.thermalService;
          imageTile.getImage().src = src;
        },
      }),

      extent: this.extent1,
    });
    tl.setProperties({
      informeId,
    });

    return tl;
  }

  private _createAnomaliaLayer(informeId: string): VectorLayer {
    const vl = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.anomaliasControlService.getStyleAnomaliasMapa(false),
    });

    vl.setProperties({
      informeId,
    });

    return vl;
  }

  initMap() {
    const satellite = new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: '',
    });
    const satelliteLayer = new TileLayer({
      source: satellite,
      // extent: this.extent1,
    });

    const aerial = new XYZ({
      url: 'https://solardrontech.es/demo_rgb/{z}/{x}/{y}.png',
      crossOrigin: '',
    });

    this.aerialLayer = new TileLayer({
      source: aerial,
      extent: this.extent1,
    });
    const osmLayer = new TileLayer({
      source: new OSM(),
      // extent: this.extent1,
    });

    // const layers = [satelliteLayer];
    const layers = [osmLayer, this.aerialLayer, ...this.thermalLayers];

    // MAPA
    const view = new View({
      center: fromLonLat([this.planta.longitud, this.planta.latitud]),
      // zoom: 18,
      zoom: this.planta.zoom,
      maxZoom: 24,
      // para la demo
      extent: this.transform([-7.060903, 38.523993, -7.0556, 38.522264]),
    });

    this.subscriptions.add(
      this.olMapService
        .createMap('map', layers, view, defaultControls({ attribution: false }))
        .subscribe((map) => (this.map = map))
    );

    this.anomaliaLayers.forEach((l) => this.map.addLayer(l));

    // inicializamos el servicio que controla el comportamiento de las anomalias
    this.subscriptions.add(
      this.anomaliasControlService
        .initService()
        .pipe(
          switchMap((value) => {
            if (value) {
              this.anomaliasControlService.mostrarAnomalias();
              return combineLatest([
                this.anomaliasControlService.anomaliaHover$,
                this.anomaliasControlService.anomaliaSelect$,
              ]);
            }
          })
        )
        .subscribe(([anomHover, anomSelect]) => {
          this.anomaliaHover = anomHover;
          this.anomaliaSelect = anomSelect;
        })
    );
  }

  private transform(extent) {
    return transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
