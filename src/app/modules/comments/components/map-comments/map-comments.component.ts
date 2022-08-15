import { Component, OnInit } from '@angular/core';

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

import { ComentariosControlService } from '@data/services/comentarios-control.service';
import { OlMapService } from '@data/services/ol-map.service';
import { ReportControlService } from '@data/services/report-control.service';
import { PlantaService } from '@data/services/planta.service';
import { AnomaliasControlService } from '@data/services/anomalias-control.service';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';

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
  private prevFeatureSelected: Feature;

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
        this.addGeoLocation();
      });

    this.subscriptions.add(this.olMapService.getThermalLayers().subscribe((layers) => (this.thermalLayers = layers)));

    this.subscriptions.add(this.olMapService.aerialLayers$.subscribe((layers) => (this.aerialLayers = layers)));

    this.subscriptions.add(this.olMapService.getAnomaliaLayers().subscribe((layers) => (this.anomaliaLayers = layers)));

    this.subscriptions.add(
      this.comentariosControlService.anomaliaSelected$.subscribe((anom) => {
        if (this.prevFeatureSelected !== undefined) {
          this.prevFeatureSelected.setStyle(this.anomaliasControlService.getStylePerdidas(false));
        }

        if (anom !== undefined) {
          if (this.anomaliaLayers.length > 0) {
            const anomaliaFeature = this.anomaliaLayers[0]
              .getSource()
              .getFeatures()
              .find((feature) => feature.getProperties().properties.anomaliaId === anom.id);

            if (anomaliaFeature !== undefined) {
              anomaliaFeature.setStyle(this.anomaliasControlService.getStylePerdidas(true));

              // seleccionamos la anomalia para luego cambiar su estilo
              this.prevFeatureSelected = anomaliaFeature;
            }
          }
        }
      })
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

    const layers = [satelliteLayer, ...this.aerialLayers, geoLocLayer , ...this.thermalLayers];

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
  }

  openCloseList() {
    this.comentariosControlService.listOpened = !this.comentariosControlService.listOpened;
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

  addGeoLocation() {
    const geoLocLayer = this.map
      .getLayers()
      .getArray()
      .find((layer) => layer.getProperties().type === 'geoLoc') as VectorLayer;

    const geoLocSource = geoLocLayer.getSource() as VectorSource;

    navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.longitude, pos.coords.latitude];
        const accuracy = circular(coords, pos.coords.accuracy);
        geoLocSource.clear(true);
        geoLocSource.addFeatures([
          new Feature(accuracy.transform('EPSG:4326', this.map.getView().getProjection())),
          new Feature(new Point(fromLonLat(coords))),
        ]);
      },
      (error) => {
        alert(`ERROR: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
      }
    );

    this.addCenterControl(geoLocSource);
  }

  addCenterControl(source: VectorSource) {
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
}
