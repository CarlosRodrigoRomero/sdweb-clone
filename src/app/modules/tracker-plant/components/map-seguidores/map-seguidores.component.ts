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
import { SeguidoresControlService } from '../../services/seguidores-control.service';
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
  public plantaId: string;
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

    this.subscriptions.add(this.olMapService.getSeguidorLayers().subscribe((layers) => (this.seguidorLayers = layers)));

    // ordenamos los informes por fecha
    this.informeIdList = this.informes.map((informe) => informe.id);

    this.plantaService
      .getLocationsArea(this.reportControlService.plantaId)
      .pipe(take(1))
      .subscribe((locAreas) => {
        const allZones = this.zonesService.getZonesBySize(this.reportControlService.planta, locAreas);
        const smallZones = allZones[allZones.length - 1];

        this.informes.forEach((informe) => {
          // creamos las capas de los seguidores para los diferentes informes
          this.seguidoresControlService
            .createSeguidorLayers(informe.id, smallZones)
            .forEach((layer) => this.olMapService.addSeguidorLayer(layer));

          // añadimos las ortofotos aereas de cada informe
          this.addAerialLayer(informe.id);

          this.initMap();

          this.addPopupOverlay();
          this.addZoomEvent();
        });
      });

    // los subscribimos al toggle de vitas y al slider temporal
    this.subscriptions.add(
      combineLatest([
        this.mapSeguidoresService.toggleViewSelected$,
        this.mapSeguidoresService.sliderTemporalSelected$,
        this.olMapService.getAerialLayers(),
      ]).subscribe(([toggleValue, sliderValue, aerialLayers]) => {
        const numLayerSelected = Number(toggleValue) + Number(3 * (sliderValue / (100 / (this.informes.length - 1))));

        this.mapSeguidoresService.layerSelected = numLayerSelected;

        // ocultamos las capas de las vistas no seleccionadas
        this.seguidorLayers.forEach((layer) => {
          if (layer.getProperties().view !== numLayerSelected) {
            layer.setVisible(false);
          }
        });

        this.aerialLayers = aerialLayers;
      })
    );

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId))
    );

    // asignamos los IDs necesarios para compartir
    this.shareReportService.setPlantaId(this.plantaId);
  }

  initMap() {
    const satellite = new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: '',
    });
    const satelliteLayer = new TileLayer({
      source: satellite,
    });

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

        this.map.once('postrender', () => {
          // setTimeout(() => (this.reportControlService.mapLoaded = true), 2000);
          this.reportControlService.mapLoaded = true;
        });
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

  private addAerialLayer(informeId: string) {
    const aerial = new XYZ({
      url: 'http://solardrontech.es/tileserver.php?/index.json?/' + informeId + '_visual/{z}/{x}/{y}.png',
      crossOrigin: null,
    });

    const aerialLayer = new TileLayer({
      source: aerial,
    });

    this.olMapService.addAerialLayer(aerialLayer);
  }

  private addZoomEvent() {
    this.map.on('moveend', (event) => {
      const zoom = this.map.getView().getZoom();
      if (zoom >= 19) {
        this.seguidorLayers.forEach((l) => l.setVisible(true));
      } else {
        this.seguidorLayers.forEach((l) => l.setVisible(false));
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
