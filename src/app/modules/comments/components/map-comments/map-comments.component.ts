import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import Map from 'ol/Map';
import { Control, defaults as defaultControls } from 'ol/control.js';
import { fromLonLat } from 'ol/proj';
import XYZ from 'ol/source/XYZ';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import VectorLayer from 'ol/layer/Vector';
import { click } from 'ol/events/condition';
import Select from 'ol/interaction/Select';
import { circular } from 'ol/geom/Polygon';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorImageLayer from 'ol/layer/VectorImage';
import Geolocation from 'ol/Geolocation';

import { ComentariosControlService } from '@data/services/comentarios-control.service';
import { OlMapService } from '@data/services/ol-map.service';
import { ReportControlService } from '@data/services/report-control.service';
import { PlantaService } from '@data/services/planta.service';
import { ViewCommentsService } from '@data/services/view-comments.service';
import { AnomaliasControlCommentsService } from '@data/services/anomalias-control-comments.service';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';
import { Fill, Stroke, Style } from 'ol/style';
import CircleStyle from 'ol/style/Circle';

@Component({
  selector: 'app-map-comments',
  templateUrl: './map-comments.component.html',
  styleUrls: ['./map-comments.component.css'],
})
export class MapCommentsComponent implements OnInit, OnDestroy {
  private map: Map;
  private planta: PlantaInterface;
  private informe: InformeInterface;
  private thermalLayer: TileLayer<any>;
  private anomaliaLayer: VectorImageLayer<any>;
  private aerialLayer: TileLayer<any>;
  private prevFeatureSelected: Feature<any>;
  thermalVisible = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private comentariosControlService: ComentariosControlService,
    private olMapService: OlMapService,
    private reportControlService: ReportControlService,
    private plantaService: PlantaService,
    private viewCommentsService: ViewCommentsService,
    private anomaliasControlCommentsService: AnomaliasControlCommentsService
  ) {}

  async ngOnInit(): Promise<void> {
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
            visible: false,
          });

          this.olMapService.addThermalLayer(thermalLayer);
        }

        // creamos la capa de anomalías
        this.olMapService.addAnomaliaLayer(this.anomaliasControlCommentsService.createCommentsAnomaliaLayers());

        // añadimos las ortofotos aereas de cada informe
        await this.olMapService.addAerialLayer(this.informe);

        this.initMap();

        this.addSelectInteraction();
        this.addClickOutFeatures();
        this.addGeoLocation();
        this.addZoomEvent();
      });

    this.subscriptions.add(this.olMapService.getThermalLayers().subscribe((layers) => (this.thermalLayer = layers[0])));

    this.subscriptions.add(this.olMapService.aerialLayers$.subscribe((layers) => (this.aerialLayer = layers[0])));

    this.subscriptions.add(
      this.olMapService.getAnomaliaLayers().subscribe((layers) => (this.anomaliaLayer = layers[0]))
    );

    this.subscriptions.add(
      this.comentariosControlService.anomaliaSelected$.subscribe((anom) => {
        if (this.prevFeatureSelected !== undefined) {
          this.prevFeatureSelected.setStyle(this.anomaliasControlCommentsService.getStyleAnoms(false));
        }

        if (anom !== undefined) {
          if (this.anomaliaLayer !== undefined) {
            const anomaliaFeature = (this.anomaliaLayer.getSource() as VectorSource<any>)
              .getFeatures()
              .find((feature) => feature.getProperties().properties.anomaliaId === anom.id);

            if (anomaliaFeature !== undefined) {
              anomaliaFeature.setStyle(this.anomaliasControlCommentsService.getStyleAnoms(true));

              // seleccionamos la anomalia para luego cambiar su estilo
              this.prevFeatureSelected = anomaliaFeature;
            }
          }
        }
      })
    );

    this.subscriptions.add(
      this.viewCommentsService.thermalLayerVisible$.subscribe((visible) => (this.thermalVisible = visible))
    );
  }

  private initMap() {
    const satellite = new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: '',
    });
    const satelliteLayer = new TileLayer({
      source: satellite,
    });

    const geoLocSource = new VectorSource();
    const geoLocLayer = new VectorLayer({
      source: geoLocSource,
    });

    geoLocLayer.setProperties({ type: 'geoLoc' });

    // asignamos diferentes z-index para que quede por encima de las demas capas
    satelliteLayer.setZIndex(0);
    this.aerialLayer.setZIndex(1);
    this.thermalLayer.setZIndex(2);
    this.anomaliaLayer.setZIndex(3);
    geoLocLayer.setZIndex(4);

    const layers = [satelliteLayer, this.aerialLayer, geoLocLayer, this.thermalLayer];

    const view = new View({
      center: fromLonLat([this.planta.longitud, this.planta.latitud]),
      zoom: this.planta.zoom,
      minZoom: this.planta.zoom - 2,
      maxZoom: 24,
      enableRotation: false,
    });

    this.subscriptions.add(
      this.olMapService.createMap('map', layers, view, defaultControls({ attribution: false })).subscribe((map) => {
        this.map = map;
      })
    );

    // añadimos la capa de anomalías al mapa
    this.map.addLayer(this.anomaliaLayer);

    // inicializamos el servicio que controla el comportamiento de las anomalias
    this.anomaliasControlCommentsService.initService().then(() => {
      this.anomaliasControlCommentsService.mostrarAnomalias();
    });
  }

  openCloseList() {
    this.comentariosControlService.listOpened = !this.comentariosControlService.listOpened;
  }

  private addSelectInteraction() {
    const select = new Select({
      condition: click,
      layers: (l) => {
        if (l.getProperties().hasOwnProperty('type') && l.getProperties().type === 'anomalias') {
          return true;
        } else {
          return false;
        }
      },
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

  private addClickOutFeatures() {
    this.map.on('click', async (event) => {
      const feature = this.map
        .getFeaturesAtPixel(event.pixel)
        .filter((item) => item.getProperties().properties !== undefined);

      if (feature.length === 0) {
        this.comentariosControlService.infoOpened = false;
        this.comentariosControlService.anomaliaSelected = undefined;
      }
    });
  }

  private addGeoLocation() {
    const geoLocLayer = this.map
      .getLayers()
      .getArray()
      .find((layer) => layer.getProperties().type === 'geoLoc') as VectorLayer<any>;

    const geoLocSource = geoLocLayer.getSource() as VectorSource<any>;

    // Añade la geolocalización
    const geolocation = new Geolocation({
      // Habilita la opción de proyección en el constructor de geolocalización.
      projection: this.map.getView().getProjection(),
      tracking: true, // Habilita el rastreo
      trackingOptions: {
        enableHighAccuracy: true,
      },
    });

    function el(id) {
      return document.getElementById(id);
    }

    const positionFeature = new Feature();
    positionFeature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({
            color: '#3399CC',
          }),
          stroke: new Stroke({
            color: '#fff',
            width: 2,
          }),
        }),
      })
    );

    geoLocSource.addFeature(positionFeature);

    geolocation.on('change:position', function () {
      const coordinates = geolocation.getPosition();
      positionFeature.setGeometry(coordinates ? new Point(coordinates) : null);
    });

    this.addCenterControl(geoLocSource);
  }

  private addCenterControl(source: VectorSource<any>) {
    const centerControl = document.getElementById('center-btn');

    centerControl.className = 'ol-control ol-unselectable locate';
    centerControl.innerHTML = '<button title="Locate me">◎</button>';
    centerControl.addEventListener('click', () => {
      if (!source.isEmpty()) {
        this.map.getView().fit(source.getExtent(), {
          maxZoom: 18,
          duration: 500,
        });
      }
    });
    this.map.addControl(
      new Control({
        element: centerControl,
      })
    );
  }

  private addZoomEvent() {
    this.map.on('moveend', () => {
      this.olMapService.currentZoom = this.map.getView().getZoom();

      this.map
        .getLayers()
        .getArray()
        .forEach((layer) => {
          if (layer.getProperties().type === 'smallZones' || layer.getProperties().type === 'anomalias') {
            (layer as VectorLayer<any>).getSource().changed();
          }
        });
    });
  }

  setThermalVisibility() {
    this.viewCommentsService.thermalLayerVisible = !this.viewCommentsService.thermalLayerVisible;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
