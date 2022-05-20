import { Component, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control.js';
import { Feature, Map } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import Polygon from 'ol/geom/Polygon';
import { Coordinate } from 'ol/coordinate';
import { DoubleClickZoom, Select, Translate } from 'ol/interaction';
import { OSM } from 'ol/source';
import { click } from 'ol/events/condition';
import LineString from 'ol/geom/LineString';

import XYZ_mod from '@shared/modules/ol-maps/xyz_mod.js';
import ImageTileMod from '@shared/modules/ol-maps/ImageTileMod.js';

import { GLOBAL } from '@data/constants/global';
import { ClassificationService } from '@data/services/classification.service';
import { InformeService } from '@data/services/informe.service';
import { OlMapService } from '@data/services/ol-map.service';
import { ThermalService } from '@data/services/thermal.service';
import { StructuresService } from '@data/services/structures.service';
import { ClustersService } from '@data/services/clusters.service';
import { AnomaliaService } from '@data/services/anomalia.service';

import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { PlantaInterface } from '@core/models/planta';
import { NormalizedModule } from '@core/models/normalizedModule';
import { Anomalia } from '@core/models/anomalia';

import moment from 'moment';

@Component({
  selector: 'app-map-classification',
  templateUrl: './map-classification.component.html',
  styleUrls: ['./map-classification.component.css'],
})
export class MapClassificationComponent implements OnInit {
  private planta: PlantaInterface;
  private informeId: string = undefined;
  private map: Map;
  private thermalLayer: ThermalLayerInterface;
  private thermalLayers: TileLayer[];
  private normModules: NormalizedModule[];
  private listaAnomalias: Anomalia[] = [];
  private normModLayer: VectorLayer = undefined;
  private prevFeatureHover: Feature;
  thermalLayerVisibility = true;
  private palette = GLOBAL.ironPalette;
  normModSelected: NormalizedModule;
  anomaliaSelected: Anomalia;
  public showAnomOk = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private classificationService: ClassificationService,
    private informeService: InformeService,
    private olMapService: OlMapService,
    private thermalService: ThermalService,
    private structuresService: StructuresService,
    private clustersService: ClustersService,
    private anomaliaService: AnomaliaService
  ) {}

  ngOnInit(): void {
    this.planta = this.classificationService.planta;

    this.informeId = this.classificationService.informeId;

    // nos conectamos a la lista de anomalias
    this.classificationService.listaAnomalias$.subscribe((anomalias) => (this.listaAnomalias = anomalias));

    // aplicamos estilos cada vez que se modifica una anomalia
    this.classificationService.anomaliaSelected$.subscribe((anomalia) => {
      this.anomaliaSelected = anomalia;

      if (anomalia !== undefined) {
        if (this.normModLayer !== undefined) {
          this.normModLayer.setStyle(this.getStyleNormMod(false));
        }
      }
    });

    this.classificationService.normModSelected$.subscribe((normMod) => (this.normModSelected = normMod));

    this.informeService
      .getThermalLayerDB$(this.informeId)
      .pipe(take(1))
      .subscribe((layers) => {
        // comprobamos si existe la thermalLayer
        if (layers.length > 0) {
          // nos suscribimos a las capas termicas del mapa
          this.subscriptions.add(
            this.olMapService
              .getThermalLayers()
              // .pipe(take(1))
              .subscribe((tLayers) => (this.thermalLayers = tLayers))
          );

          // esta es la thermalLayer de la DB
          this.thermalLayer = layers[0];

          this.olMapService.addThermalLayer(this.createThermalLayer(this.thermalLayer, this.informeId));

          this.initMap();

          this.createNormModLayer();
          this.addNormModules();

          // this.addZoomEvent();

          this.addPointerOnHover();
          this.addOnHoverAction();
          this.addOnDoubleClickInteraction();
          // this.addClickInteraction();
          this.addSelectInteraction();
          this.addClickOutFeatures();
        } else {
          this.initMap();
        }
      });
  }

  private createThermalLayer(thermalLayer: ThermalLayerInterface, informeId: string): TileLayer {
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
          imageTile.palette = this.palette;
          imageTile.thermalService = this.thermalService;
          imageTile.getImage().src = src;
          imageTile.thermalLayer = thermalLayer;
        },
      }),

      // extent: this.extent1,
    });
    tl.setProperties({
      informeId,
      name: 'thermalLayer',
      layerDB: thermalLayer,
    });

    return tl;
  }

  initMap() {
    /* const satellite = new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: '',
    });
    const satelliteLayer = new TileLayer({
      source: satellite,
    }); */

    const osmLayer = new TileLayer({
      source: new OSM(),
    });

    const aerial = new XYZ({
      url: 'http://solardrontech.es/tileserver.php?/index.json?/' + this.informeId + '_visual/{z}/{x}/{y}.png',
      crossOrigin: '',
    });

    const aerialLayer = new TileLayer({
      source: aerial,
    });

    const layers = [osmLayer, aerialLayer, ...this.thermalLayers];

    // MAPA
    const view = new View({
      center: fromLonLat([this.planta.longitud, this.planta.latitud]),
      zoom: this.planta.zoom,
      minZoom: this.planta.zoom - 2,
      maxZoom: this.planta.zoom + 8,
    });

    this.olMapService
      .createMap('map', layers, view, defaultControls({ attribution: false }))
      .pipe(take(1))
      .subscribe((map) => {
        this.map = map;

        // desactivamos el zoom al hacer dobleclick para que no interfiera
        this.map.getInteractions().forEach((interaction) => {
          if (interaction instanceof DoubleClickZoom) {
            this.map.removeInteraction(interaction);
          }
        });
      });
  }

  private createNormModLayer() {
    this.normModLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleNormMod(false),
    });

    this.normModLayer.setProperties({
      id: 'normModLayer',
    });

    this.map.addLayer(this.normModLayer);
  }

  private addNormModules() {
    const normModsSource = this.normModLayer.getSource();

    this.classificationService.normModules$.pipe(take(1)).subscribe((normModules) => {
      normModsSource.clear();

      this.normModules = normModules;

      this.normModules.forEach((normMod) => {
        const coords = this.structuresService.coordsDBToCoordinate(normMod.coords);

        const feature = new Feature({
          geometry: new Polygon([coords]),
          properties: {
            id: normMod.id,
            name: 'normMod',
            normMod,
          },
        });

        normModsSource.addFeature(feature);
      });
    });
  }

  private addZoomEvent() {
    this.map.on('moveend', () => {
      const zoom = this.map.getView().getZoom();

      if (zoom > this.planta.zoom + 3) {
        this.normModLayer.setVisible(true);
      } else {
        this.normModLayer.setVisible(false);
      }
    });
  }

  private addPointerOnHover() {
    this.map.on('pointermove', (event) => {
      if (this.map.hasFeatureAtPixel(event.pixel)) {
        let feature = this.map
          .getFeaturesAtPixel(event.pixel)
          .filter((item) => item.getProperties().properties !== undefined);
        feature = feature.filter((item) => item.getProperties().properties.name === 'normMod');

        if (feature.length > 0) {
          // cambia el puntero por el de seleccionar
          this.map.getViewport().style.cursor = 'pointer';
        } else {
          // vuelve a poner el puntero normal
          this.map.getViewport().style.cursor = 'inherit';
        }
      } else {
        // vuelve a poner el puntero normal
        this.map.getViewport().style.cursor = 'inherit';
      }
    });
  }

  private addOnHoverAction() {
    let currentFeatureHover: Feature;
    this.map.on('pointermove', (event) => {
      // impedimos hover cuando estamos moviendo una anomalia
      if (this.classificationService.normModAnomaliaSelected === undefined) {
        if (this.map.hasFeatureAtPixel(event.pixel)) {
          const feature: Feature = this.map
            .getFeaturesAtPixel(event.pixel)
            .filter((item) => item.getProperties().properties !== undefined)
            .filter((item) => item.getProperties().properties.name === 'normMod')[0] as Feature;

          if (feature !== undefined) {
            // cuando pasamos de un modulo a otro directamente sin pasar por vacio
            if (this.prevFeatureHover !== undefined && this.prevFeatureHover !== feature) {
              // quitamos el efecto resaltado
              this.prevFeatureHover.setStyle(this.getStyleNormMod(false));
              this.prevFeatureHover = undefined;
            }
            currentFeatureHover = feature;

            // aplicamos el efecto resaltado
            feature.setStyle(this.getStyleNormMod(true));

            this.classificationService.normModHovered = feature.getProperties().properties.normMod;

            this.prevFeatureHover = feature;
          } else {
            this.classificationService.normModHovered = undefined;
          }
        } else {
          if (currentFeatureHover !== undefined) {
            // quitamos el efecto resaltado
            currentFeatureHover.setStyle(this.getStyleNormMod(false));
            currentFeatureHover = undefined;

            this.classificationService.normModHovered = undefined;
          }
        }
      }
    });
  }

  private addOnDoubleClickInteraction() {
    this.map.on('dblclick', (event) => {
      const feature = this.map.getFeaturesAtPixel(event.pixel)[0] as Feature;
      if (feature) {
        const normMod: NormalizedModule = feature.getProperties().properties.normMod;

        // no permitimos doble click sobre anomalias
        if (!this.listaAnomalias.map((anom) => anom.id).includes(normMod.id)) {
          this.classificationService.normModSelected = normMod;

          const coords = this.structuresService.coordsDBToCoordinate(feature.getProperties().properties.normMod.coords);

          const date = this.getDatetime(coords);

          this.classificationService.createAnomaliaFromNormModule(feature, date);
        }
      }
    });
  }

  private addClickInteraction() {
    let features;

    this.map.on('click', (event) => {
      features = this.map.getFeaturesAtPixel(event.pixel);
      const feature = features[0] as Feature;
      if (feature) {
        // asignamos el modulo normalizado seleccionado
        this.classificationService.normModAnomaliaSelected = this.normModules.find(
          (normMod) => normMod.id === feature.getProperties().properties.id
        );
      }
    });

    const translate = new Translate({
      features,
    });

    translate.on('translateend', (e) => {
      const newCoords = (e.features.getArray()[0].getGeometry() as Polygon).getCoordinates();

      // aplicamos las nuevas coordenadas del modulo y guardamos los cambios en la DB
      this.classificationService.normModAnomaliaSelected.coords = this.structuresService.coordinateToObject(newCoords);
      this.structuresService.updateNormModule(this.classificationService.normModAnomaliaSelected);

      // actualizamos tb la anomalia seleccionada en la DB
      this.anomaliaService.updateAnomaliaField(this.classificationService.normModAnomaliaSelected.id, 'featureCoords', {
        ...newCoords[0],
      });
    });

    this.map.addInteraction(translate);
  }

  private addSelectInteraction() {
    const select = new Select({
      style: this.getStyleNormMod(true),
      condition: click,
      layers: (l) => {
        if (l.getProperties().id === 'normModLayer') {
          return true;
        } else {
          return false;
        }
      },
      filter: (f) => {
        if (this.listaAnomalias !== undefined && this.listaAnomalias.length > 0) {
          if (this.listaAnomalias.map((anom) => anom.id).includes(f.getProperties().properties.id)) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      },
    });

    const features = select.getFeatures();

    select.on('select', (e) => {
      if (e.selected.length > 0) {
        // asignamos el modulo normalizado seleccionado
        this.classificationService.normModAnomaliaSelected = this.normModules.find(
          (normMod) => normMod.id === features.getArray()[0].getProperties().properties.id
        );

        // marcamos la anomalia como seleccionada
        this.classificationService.anomaliaSelected = this.listaAnomalias.find(
          (anom) => anom.id === features.getArray()[0].getProperties().properties.id
        );
      }
    });

    const translate = new Translate({
      features,
    });

    translate.on('translateend', (e) => {
      const newCoords = (e.features.getArray()[0].getGeometry() as Polygon).getCoordinates();

      // aplicamos las nuevas coordenadas del modulo y guardamos los cambios en la DB
      this.classificationService.normModAnomaliaSelected.coords = this.structuresService.coordinateToObject(newCoords);
      this.structuresService.updateNormModule(this.classificationService.normModAnomaliaSelected);

      // actualizamos tb la anomalia seleccionada en la DB
      this.anomaliaService.updateAnomaliaField(this.classificationService.normModAnomaliaSelected.id, 'featureCoords', {
        ...newCoords[0],
      });
    });

    this.map.addInteraction(select);
    this.map.addInteraction(translate);
  }

  private addClickOutFeatures() {
    this.map.on('click', (event) => {
      const feature = this.map
        .getFeaturesAtPixel(event.pixel)
        .filter((item) => item.getProperties().properties !== undefined);

      if (feature.length === 0) {
        // reseteamos lo seleccionado
        this.classificationService.resetElemsSelected();
      }
    });
  }

  private getDatetime(coords: Coordinate[]) {
    const dateString = this.getClosestPoint(coords);

    return this.dateStringToUnix(dateString);
  }

  private getClosestPoint(coords: Coordinate[]): string {
    const distances = this.clustersService.coordsPuntosTrayectoria.map((coord) => {
      const line = new LineString([coords[0], coord]);

      return line.getLength();
    });

    const minDistance = Math.min(...distances);

    const indexClosestPoint = distances.indexOf(minDistance);

    const closestPoint = this.clustersService.puntosTrayectoria[indexClosestPoint];

    return closestPoint.date;
  }

  private dateStringToUnix(date: string) {
    const unix = moment(date, 'DD/MM/YYYY hh:mm:ss').unix();

    return unix;
  }

  private getStyleNormMod(hovered: boolean) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        if (
          this.listaAnomalias !== undefined &&
          this.listaAnomalias.map((anom) => anom.id).includes(feature.getProperties().properties.id)
        ) {
          const anomalia = this.listaAnomalias.find((anom) => anom.id === feature.getProperties().properties.id);

          return new Style({
            stroke: new Stroke({
              color: GLOBAL.colores_tipos[anomalia.tipo],
              width: hovered ? 4 : 2,
            }),
            fill: new Fill({
              color: 'rgba(0,0,0,0)',
            }),
          });
        } else {
          return new Style({
            stroke: new Stroke({
              color: hovered ? 'white' : 'rgba(0,0,0,0)',
              width: 2,
            }),
            fill: new Fill({
              color: 'rgba(0,0,0,0)',
            }),
          });
        }
      }
    };
  }

  setThermalLayerVisibility() {
    this.thermalLayerVisibility = !this.thermalLayerVisibility;
    this.map
      .getLayers()
      .getArray()
      .filter((layer) => layer.getProperties().name !== undefined && layer.getProperties().name === 'thermalLayer')
      .forEach((layer) => layer.setVisible(this.thermalLayerVisibility));
  }

  setThermalPalette() {
    if (this.palette === GLOBAL.ironPalette) {
      this.palette = GLOBAL.rainbow_hc_palette;
    } else {
      this.palette = GLOBAL.ironPalette;
    }

    this.map
      .getLayers()
      .getArray()
      .filter((layer) => layer.getProperties().name !== undefined && layer.getProperties().name === 'thermalLayer')
      .forEach((layer) => {
        const thermalLayerDB: ThermalLayerInterface = layer.getProperties().layerDB;

        ((layer as TileLayer).getSource() as XYZ_mod).setTileLoadFunction((imageTile, src) => {
          imageTile.rangeTempMax = thermalLayerDB.rangeTempMax;
          imageTile.rangeTempMin = thermalLayerDB.rangeTempMin;
          imageTile.palette = this.palette;
          imageTile.thermalService = this.thermalService;
          imageTile.getImage().src = src;
          imageTile.thermalLayer = thermalLayerDB;
        });
      });
  }
}