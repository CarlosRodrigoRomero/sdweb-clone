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
  public sliderYear: number;
  public aerialLayers: TileLayer[];
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

    this.subscriptions.add(
      this.reportControlService.plantaId$
        .pipe(
          take(1),
          switchMap((plantaId) => {
            this.plantaId = plantaId;

            // Obtenemos todas las capas para esta planta
            return combineLatest([
              this.plantaService.getThermalLayers$(this.plantaId),
              this.reportControlService.informes$,
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
            informes.forEach((informe) => {
              const tl = thermalLayers.find((item) => item.informeId === informe.id);

              // this.thermalService.sliderMin = tl.rangeTempMin;
              // this.thermalService.sliderMax = tl.rangeTempMax;

              // TODO: Comprobar que existe...
              if (tl !== undefined) {
                this.olMapService.addThermalLayer(this._createThermalLayer(tl, informe.id));
              }

              // creamos las capas de anomalías para los diferentes informes
              this.olMapService.addAnomaliaLayer(this._createAnomaliaLayer(informe.id));

              // añadimos las ortofotos aereas de cada informe
              this.addAerialLayer(informe.id);
            });

            this.planta = planta;

            // asignamos los IDs necesarios para compartir
            this.shareReportService.setPlantaId(this.plantaId);

            return combineLatest([
              this.olMapService.getThermalLayers(),
              this.olMapService.getAnomaliaLayers(),
              this.olMapService.getAerialLayers(),
              this.reportControlService.selectedInformeId$,
            ]);
          })
        )
        .subscribe(([therLayers, anomLayers, aerLayers, informeId]) => {
          if (this.anomaliaLayers === undefined) {
            // nos suscribimos a las capas termica y de anomalias
            this.thermalLayers = therLayers;
            this.anomaliaLayers = anomLayers;
            this.aerialLayers = aerLayers;
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
          imageTile.thermalLayer = thermalLayer;
        },
      }),
      preload: Infinity,
    });
    // solo lo aplicamos a la planta DEMO
    if (this.plantaId === 'egF0cbpXnnBnjcrusoeR') {
      tl.setExtent(this.extent1);
    }

    tl.setProperties({
      informeId,
    });

    return tl;
  }

  private addAerialLayer(informeId: string) {
    const aerial = new XYZ({
      url: 'http://solardrontech.es/tileserver.php?/index.json?/' + informeId + '_visual/{z}/{x}/{y}.png',
      crossOrigin: '',
    });

    const aerialLayer = new TileLayer({
      source: aerial,
      preload: Infinity,
    });

    this.olMapService.addAerialLayer(aerialLayer);
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
    });

    let aerial;
    // solo lo aplicamos a la planta DEMO
    if (this.plantaId === 'egF0cbpXnnBnjcrusoeR') {
      aerial = new XYZ({
        url: 'https://solardrontech.es/demo_rgb/{z}/{x}/{y}.png',
        crossOrigin: '',
      });

      const aerialLayer = new TileLayer({
        source: aerial,
      });

      aerialLayer.setExtent(this.extent1);

      this.aerialLayers = [aerialLayer];
    }

    const osmLayer = new TileLayer({
      source: new OSM(),
    });

    const layers = [satelliteLayer, ...this.aerialLayers, ...this.thermalLayers];

    // MAPA
    let view: View;

    if (this.plantaId === 'egF0cbpXnnBnjcrusoeR') {
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
        maxZoom: this.planta.zoom + 8,
      });
    }

    this.subscriptions.add(
      this.olMapService.createMap('map', layers, view, defaultControls({ attribution: false })).subscribe((map) => {
        this.map = map;

        this.map.once('postrender', () => {
          setTimeout(() => (this.reportControlService.mapLoaded = true), 2000);
        });
      })
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
