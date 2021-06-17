import { Component, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';

import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control.js';
import { Feature, Map } from 'ol';
import Overlay from 'ol/Overlay';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import Polygon from 'ol/geom/Polygon';
import { Coordinate } from 'ol/coordinate';
import { DoubleClickZoom } from 'ol/interaction';
import { OSM } from 'ol/source';

import XYZ_mod from '@shared/modules/ol-maps/xyz_mod.js';
import ImageTileMod from '@shared/modules/ol-maps/ImageTileMod.js';

import { GLOBAL } from '@core/services/global';
import { ClassificationService } from '@core/services/classification.service';
import { InformeService } from '@core/services/informe.service';
import { OlMapService } from '@core/services/ol-map.service';
import { ThermalService } from '@core/services/thermal.service';
import { StructuresService } from '@core/services/structures.service';

import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { PlantaInterface } from '@core/models/planta';
import { NormalizedModule } from '@core/models/normalizedModule';
import { Anomalia } from '@core/models/anomalia';

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
  private popup: Overlay;
  private listaAnomalias: Anomalia[] = [];
  private normModLayer: VectorLayer = undefined;
  private prevFeatureHover: Feature;
  thermalLayerVisibility = true;

  constructor(
    private classificationService: ClassificationService,
    private informeService: InformeService,
    private olMapService: OlMapService,
    private thermalService: ThermalService,
    private structuresService: StructuresService
  ) {}

  ngOnInit(): void {
    this.planta = this.classificationService.planta;

    this.informeId = this.classificationService.informeId;

    // nos conectamos a la lista de anomalias
    this.classificationService.listaAnomalias$.subscribe((lista) => {
      this.listaAnomalias = lista;

      if (this.normModLayer !== undefined) {
        this.normModLayer.setStyle(this.getStyleNormMod(false));
      }
    });

    this.informeService
      .getThermalLayerDB$(this.informeId)
      .pipe(take(1))
      .subscribe((layers) => {
        // comprobamos si existe la thermalLayer
        if (layers.length > 0) {
          // nos suscribimos a las capas termicas del mapa
          this.olMapService.getThermalLayers().subscribe((tLayers) => (this.thermalLayers = tLayers));

          // esta es la thermalLayer de la DB
          this.thermalLayer = layers[0];

          this.olMapService.addThermalLayer(this.createThermalLayer(this.thermalLayer, this.informeId));

          this.initMap();

          this.createNormModLayer();
          this.addNormModules();

          this.addPopupOverlay();

          this.addPointerOnHover();
          this.addOnHoverAction();
          this.addOnDoubleClickInteraction();
          this.addClickOutFeatures();
        } else {
          this.initMap();
        }

        // this.initMap();
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
    this.structuresService.getNormModules(this.thermalLayer).subscribe((normModules) => {
      const normModLayer = this.map
        .getLayers()
        .getArray()
        .find((layer) => layer.getProperties().id === 'normModLayer') as VectorLayer;

      const normModsSource = normModLayer.getSource();

      normModsSource.clear();

      this.normModules = normModules;

      this.normModules.forEach((normMod) => {
        const coords = this.structuresService.objectToCoordinate(normMod.coords);

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
    });
  }

  private addOnDoubleClickInteraction() {
    this.map.on('dblclick', (event) => {
      // desactivamos el zoom al hacer dobleclick para que no interfiera
      this.map.getInteractions().forEach((interaction) => {
        if (interaction instanceof DoubleClickZoom) {
          this.map.removeInteraction(interaction);
        }
      });

      const feature = this.map.getFeaturesAtPixel(event.pixel)[0] as Feature;
      if (feature) {
        const normMod: NormalizedModule = feature.getProperties().properties.normMod;
        this.classificationService.normModSelected = normMod;

        const coords = this.structuresService.objectToCoordinate(feature.getProperties().properties.normMod.coords);

        this.popup.setPosition(coords[0]);

        this.classificationService.createAnomaliaFromNormModule(feature);
      }
    });
  }

  private addClickOutFeatures() {
    this.map.on('click', (event) => {
      const feature = this.map
        .getFeaturesAtPixel(event.pixel)
        .filter((item) => item.getProperties().properties !== undefined);

      if (feature.length === 0) {
        this.classificationService.normModSelected = undefined;
        this.popup.setPosition(undefined);
        this.classificationService.anomaliaSelected = undefined;
      }
    });
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
}
