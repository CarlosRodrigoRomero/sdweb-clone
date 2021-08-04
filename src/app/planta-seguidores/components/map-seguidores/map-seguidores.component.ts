import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { switchMap, take } from 'rxjs/operators';
import { combineLatest, Subscription } from 'rxjs';

import Map from 'ol/Map';
import { fromLonLat } from 'ol/proj.js';
import View from 'ol/View';
import { Fill, Icon, Stroke, Style } from 'ol/style';
import Select from 'ol/interaction/Select';
import { Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { Feature, Overlay } from 'ol';
import Polygon from 'ol/geom/Polygon';
import { defaults as defaultControls } from 'ol/control.js';
import OverlayPositioning from 'ol/OverlayPositioning';
import XYZ from 'ol/source/XYZ';

import { PlantaService } from '@core/services/planta.service';
import { MapSeguidoresService } from '../../services/map-seguidores.service';
import { IncrementosService } from '../../services/incrementos.service';
import { GLOBAL } from '@core/services/global';
import { InformeService } from '@core/services/informe.service';
import { FilterService } from '@core/services/filter.service';
import { OlMapService } from '@core/services/ol-map.service';
import { ShareReportService } from '@core/services/share-report.service';
import { ReportControlService } from '@core/services/report-control.service';
import { SeguidoresControlService } from '../../services/seguidores-control.service';

import { PlantaInterface } from '@core/models/planta';
import { Seguidor } from '@core/models/seguidor';
import { LatLngLiteral } from '@agm/core';
import { Coordinate } from 'ol/coordinate';

@Component({
  selector: 'app-map-seguidores',
  templateUrl: './map-seguidores.component.html',
  styleUrls: ['./map-seguidores.component.scss'],
})
export class MapSeguidoresComponent implements OnInit, OnDestroy {
  public plantaId: string;
  public planta: PlantaInterface;
  public map: Map;
  public rangeMin: number;
  public rangeMax: number;
  public palleteJSON: string;
  public selectedInformeId: string;
  public seguidorSelected: Seguidor;
  public seguidorHovered: Seguidor;
  public locAreasVectorSource: VectorSource;
  public seguidorSeleccionado: Seguidor;
  public listaSeguidores: Seguidor[];
  public sliderYear: number;
  public aerialLayer: TileLayer;
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
    private informeService: InformeService,
    public filterService: FilterService,
    private olMapService: OlMapService,
    private incrementosService: IncrementosService,
    private reportControlService: ReportControlService,
    private seguidoresControlService: SeguidoresControlService,
    private shareReportService: ShareReportService
  ) {}

  ngOnInit(): void {
    this.mousePosition = null;

    this.subscriptions.add(
      this.reportControlService.plantaId$
        .pipe(
          take(1),
          switchMap((plantaId) => {
            this.plantaId = plantaId;

            // Obtenemos todas las capas para esta planta
            return combineLatest([
              this.informeService.getInformesDePlanta(this.plantaId),
              this.plantaService.getPlanta(this.plantaId),
            ]);
          })
        )
        .pipe(take(1))
        .subscribe(([informes, planta]) => {
          this.olMapService.getSeguidorLayers().subscribe((layers) => (this.seguidorLayers = layers));
          // this.olMapService.getIncrementoLayers().subscribe((layers) => (this.incrementoLayers = layers));

          // this.incrementosService.initService();

          // ordenamos los informes por fecha
          this.informeIdList = informes.sort((a, b) => a.fecha - b.fecha).map((informe) => informe.id);
          // this.incrementosService.informeIdList = informes.sort((a, b) => a.fecha - b.fecha).map((informe) => informe.id);

          informes
            .sort((a, b) => a.fecha - b.fecha)
            .forEach((informe) => {
              // creamos las capas de los seguidores para los diferentes informes
              this.seguidoresControlService
                .createSeguidorLayers(informe.id)
                .forEach((layer) => this.olMapService.addSeguidorLayer(layer));

              // creamos las capas de los incrementos para los diferentes informes
              // this.incrementosService
              //   .createIncrementoLayers(informe.id)
              //   .forEach((layer) => this.olMapService.addIncrementoLayer(layer));
            });

          // los subscribimos al toggle de vitas y al slider temporal
          combineLatest([
            this.mapSeguidoresService.toggleViewSelected$,
            this.mapSeguidoresService.sliderTemporalSelected$,
          ]).subscribe(([toggleValue, sliderValue]) => {
            const layerSelected = Number(toggleValue) + Number(3 * (sliderValue / (100 / (informes.length - 1))));

            this.mapSeguidoresService.layerSelected = layerSelected;

            // ocultamos las 3 capas de las vistas
            this.seguidorLayers.forEach((layer) => layer.setOpacity(0));
            // this.incrementoLayers.forEach((layer) => layer.setOpacity(0));

            // mostramos la capa seleccionada
            this.seguidorLayers[layerSelected].setOpacity(1);
            // this.incrementoLayers[v].setOpacity(1);
          });

          this.planta = planta;

          // asignamos los IDs necesarios para compartir
          this.shareReportService.setPlantaId(this.plantaId);

          // seleccionamos el informe mas reciente de la planta
          this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId));
          // this.selectedInformeId = this.informeIdList[this.informeIdList.length - 1];

          // asignamos el informe para compartir
          // this.shareReportService.setInformeID(this.informesList[this.informesList.length - 1]);

          // this.mapSeguidoresService.selectedInformeId = this.informeIdList[this.informeIdList.length - 1];

          this.initMap();

          this.addPopupOverlay();
        })
    );
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

    const layers = [satelliteLayer];

    // MAPA
    const view = new View({
      center: fromLonLat([this.planta.longitud, this.planta.latitud]),
      zoom: this.planta.zoom,
      maxZoom: 20,
      minZoom: 14,
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
    this.subscriptions.add(
      this.seguidoresControlService
        .initService()
        .pipe(
          switchMap((value) => {
            if (value) {
              this.seguidoresControlService.mostrarSeguidores();

              return this.seguidoresControlService.seguidorHovered$;
            }
          })
        )
        .subscribe((segHover) => (this.seguidorHovered = segHover))
    );

    // this.incrementoLayers.forEach((l) => this.map.addLayer(l));
  }

  private addPopupOverlay() {
    const container = document.getElementById('popup');

    this.popup = new Overlay({
      id: 'popup',
      element: container,
      autoPan: true,
      autoPanAnimation: {
        duration: 250,
      },
      position: undefined,
    });

    this.map.addOverlay(this.popup);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
