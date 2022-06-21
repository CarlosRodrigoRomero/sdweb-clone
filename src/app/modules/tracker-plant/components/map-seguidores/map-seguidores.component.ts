import { Component, OnDestroy, OnInit } from '@angular/core';

import { switchMap, take } from 'rxjs/operators';
import { combineLatest, Subscription } from 'rxjs';

import Map from 'ol/Map';
import { fromLonLat } from 'ol/proj.js';
import View from 'ol/View';
import { TileDebug, Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { Overlay } from 'ol';
import { defaults as defaultControls } from 'ol/control.js';
import XYZ from 'ol/source/XYZ';

import { PlantaService } from '@data/services/planta.service';
import { MapSeguidoresService } from '../../services/map-seguidores.service';
import { IncrementosService } from '../../services/incrementos.service';
import { FilterService } from '@data/services/filter.service';
import { OlMapService } from '@data/services/ol-map.service';
import { ShareReportService } from '@data/services/share-report.service';
import { ReportControlService } from '@data/services/report-control.service';
import { SeguidoresControlService } from '@data/services/seguidores-control.service';
import { ZonesService } from '@data/services/zones.service';

import { PlantaInterface } from '@core/models/planta';
import { Seguidor } from '@core/models/seguidor';
import { InformeInterface } from '@core/models/informe';

@Component({
  selector: 'app-map-seguidores',
  templateUrl: './map-seguidores.component.html',
  styleUrls: ['./map-seguidores.component.scss'],
})
export class MapSeguidoresComponent implements OnInit, OnDestroy {
  public planta: PlantaInterface;
  private informes: InformeInterface[];
  public map: Map;
  public rangeMin: number;
  public rangeMax: number;
  public palleteJSON: string;
  public selectedInformeId: string;
  public seguidorHovered: Seguidor;
  public locAreasVectorSource: VectorSource;
  public listaSeguidores: Seguidor[];
  public sliderYear: number;
  public aerialLayers: TileLayer[];
  public thermalSource;
  private seguidorLayers: VectorLayer[];
  private incrementoLayers: VectorLayer[];
  public leftOpened: boolean;
  public rightOpened: boolean;
  public statsOpened: boolean;
  public anomaliasLoaded = false;
  public mousePosition;
  public informeIdList: string[] = [];
  public sharedReport = false;
  private popup: Overlay;

  private subscriptions: Subscription = new Subscription();

  constructor(
    public mapSeguidoresService: MapSeguidoresService,
    private plantaService: PlantaService,
    public filterService: FilterService,
    private olMapService: OlMapService,
    private incrementosService: IncrementosService,
    private reportControlService: ReportControlService,
    private seguidoresControlService: SeguidoresControlService,
    private shareReportService: ShareReportService,
    private zonesService: ZonesService
  ) {}

  ngOnInit(): void {
    this.planta = this.reportControlService.planta;
    this.informes = this.reportControlService.informes;

    this.mousePosition = null;

    // ordenamos los informes por fecha
    this.informeIdList = this.informes.map((informe) => informe.id);

    if (this.zonesService.thereAreZones) {
      const allZones = this.zonesService.zonesBySize;
      const smallZones = allZones[allZones.length - 1];

      this.informes.forEach(async (informe, index) => {
        // creamos las capas de los seguidores para los diferentes informes o zonas
        this.seguidoresControlService
          .createSeguidorLayers(informe.id, smallZones)
          .forEach((layer) => this.olMapService.addSeguidorLayer(layer));

        // añadimos las ortofotos aereas de cada informe
        await this.olMapService.addAerialLayer(informe.id);

        if (index === this.informes.length - 1) {
          this.initMap();

          this.addPopupOverlay();
        }
      });
    } else {
      this.informes.forEach(async (informe, index) => {
        // creamos las capas de los seguidores para los diferentes informes
        this.seguidoresControlService
          .createSeguidorLayers(informe.id)
          .forEach((layer) => this.olMapService.addSeguidorLayer(layer));

        // añadimos las ortofotos aereas de cada informe
        await this.olMapService.addAerialLayer(informe.id);

        if (index === this.informes.length - 1) {
          this.initMap();

          this.addPopupOverlay();
        }
      });
    }

    this.subscriptions.add(this.olMapService.aerialLayers$.subscribe((layers) => (this.aerialLayers = layers)));

    this.subscriptions.add(this.olMapService.getSeguidorLayers().subscribe((layers) => (this.seguidorLayers = layers)));

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId))
    );

    // asignamos los IDs necesarios para compartir
    this.shareReportService.setPlantaId(this.planta.id);
  }

  initMap() {
    const satellite = new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: '',
    });
    const satelliteLayer = new TileLayer({
      source: satellite,
    });
    satelliteLayer.setProperties({ type: 'satellite' });

    const layers = [
      satelliteLayer,
      ...this.aerialLayers,
      // new TileLayer({
      //   source: new TileDebug(),
      // }),
    ];

    // MAPA
    const view = new View({
      center: fromLonLat([this.planta.longitud, this.planta.latitud]),
      zoom: this.planta.zoom,
      minZoom: this.planta.zoom - 2,
      maxZoom: this.planta.zoom + 8,
    });

    // creamos el mapa a traves del servicio y nos subscribimos a el
    this.subscriptions.add(
      this.olMapService.createMap('map', layers, view, defaultControls({ attribution: false })).subscribe((map) => {
        this.map = map;

        this.map.once('postrender', () => (this.reportControlService.mapLoaded = true));
      })
    );

    this.seguidorLayers.forEach((l) => this.map.addLayer(l));

    // inicializamos el servicio que controla el comportamiento de los seguidores
    this.seguidoresControlService.initService().then((value) => {
      if (value) {
        this.seguidoresControlService.mostrarSeguidores();

        this.subscriptions.add(
          this.seguidoresControlService.seguidorHovered$.subscribe((segHover) => (this.seguidorHovered = segHover))
        );
      }
    });
  }

  private addPopupOverlay() {
    const container = document.getElementById('popup');

    this.popup = new Overlay({
      id: 'popup',
      element: container,
      position: undefined,
      /* autoPan: true,
      autoPanAnimation: {
        duration: 250,
      }, */
    });

    this.map.addOverlay(this.popup);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
