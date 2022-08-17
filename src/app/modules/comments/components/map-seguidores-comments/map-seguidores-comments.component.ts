import { Component, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { Control, defaults as defaultControls } from 'ol/control.js';
import { Feature, View } from 'ol';
import { XYZ } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import { fromLonLat } from 'ol/proj';
import { Select } from 'ol/interaction';
import { click } from 'ol/events/condition';
import { circular } from 'ol/geom/Polygon';

import { SeguidoresControlCommentsService } from '@data/services/seguidores-control-comments.service';
import { OlMapService } from '@data/services/ol-map.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ComentariosControlService } from '@data/services/comentarios-control.service';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';
import { FilterService } from '@data/services/filter.service';
import { Seguidor } from '@core/models/seguidor';
import Point from 'ol/geom/Point';

@Component({
  selector: 'app-map-seguidores-comments',
  templateUrl: './map-seguidores-comments.component.html',
  styleUrls: ['./map-seguidores-comments.component.css'],
})
export class MapSeguidoresCommentsComponent implements OnInit {
  private map: Map;
  private planta: PlantaInterface;
  private informe: InformeInterface;
  private aerialLayer: TileLayer;
  private seguidoresLayer: VectorLayer;
  private prevFeatureSelected: Feature;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private olMapService: OlMapService,
    private seguidoresControlCommentsService: SeguidoresControlCommentsService,
    private reportControlService: ReportControlService,
    private comentariosControlService: ComentariosControlService,
    private filterService: FilterService
  ) {}

  async ngOnInit(): Promise<void> {
    this.planta = this.reportControlService.planta;
    this.informe = this.reportControlService.informes.find(
      (inf) => inf.id === this.reportControlService.selectedInformeId
    );

    // creamos la capa de seguidores
    this.olMapService.addSeguidorLayer(this.seguidoresControlCommentsService.createCommentsSeguidoresLayers());

    this.subscriptions.add(this.olMapService.aerialLayers$.subscribe((layers) => (this.aerialLayer = layers[0])));

    // añadimos las ortofotos aereas de cada informe
    await this.olMapService.addAerialLayer(this.informe);

    this.subscriptions.add(
      this.olMapService.getSeguidorLayers().subscribe((layers) => (this.seguidoresLayer = layers[0]))
    );

    this.subscriptions.add(
      this.comentariosControlService.seguidorSelected$.subscribe((seg) => {
        if (this.prevFeatureSelected !== undefined) {
          this.prevFeatureSelected.setStyle(this.seguidoresControlCommentsService.getStyleSegs(false));
        }

        if (seg !== undefined) {
          if (this.seguidoresLayer !== undefined) {
            const seguidorFeature = this.seguidoresLayer
              .getSource()
              .getFeatures()
              .find((feature) => feature.getProperties().properties.anomaliaId === seg.id);

            if (seguidorFeature !== undefined) {
              seguidorFeature.setStyle(this.seguidoresControlCommentsService.getStyleSegs(true));

              // seleccionamos la anomalia para luego cambiar su estilo
              this.prevFeatureSelected = seguidorFeature;
            }
          }
        }
      })
    );

    this.initMap();

    this.addSelectInteraction();
    this.addGeoLocation();
    this.addZoomEvent();
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

    const layers = [satelliteLayer, this.aerialLayer, geoLocLayer];

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
    this.map.addLayer(this.seguidoresLayer);

    // inicializamos el servicio que controla el comportamiento de las anomalias
    this.seguidoresControlCommentsService.initService().then(() => {
      this.seguidoresControlCommentsService.mostrarSeguidores();
    });
  }

  private addSelectInteraction() {
    const select = new Select({
      condition: click,
      layers: (l) => {
        if (l.getProperties().hasOwnProperty('type') && l.getProperties().type === 'seguidores') {
          return true;
        } else {
          return false;
        }
      },
    });

    select.setProperties({ id: 'selectSeguidor' });

    this.map.addInteraction(select);
    select.on('select', (e) => {
      if (e.selected.length > 0) {
        if (e.selected[0].getProperties().hasOwnProperty('properties')) {
          const seguidorId = e.selected[0].getProperties().properties.seguidorId;
          const seguidor = this.filterService.filteredElements.find(
            (seg) => (seg as Seguidor).id === seguidorId
          ) as Seguidor;

          this.comentariosControlService.seguidorSelected = seguidor;

          this.comentariosControlService.anomaliaSelected = seguidor.anomaliasCliente[0];

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

  private addZoomEvent() {
    this.map.on('moveend', () => {
      this.olMapService.currentZoom = this.map.getView().getZoom();

      this.map
        .getLayers()
        .getArray()
        .forEach((layer) => {
          if (layer.getProperties().type === 'smallZones' || layer.getProperties().type === 'seguidores') {
            (layer as VectorLayer).getSource().changed();
          }
        });
    });
  }

  openCloseList() {
    this.comentariosControlService.listOpened = !this.comentariosControlService.listOpened;
  }
}
