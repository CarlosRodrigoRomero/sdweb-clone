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
import { Structure } from '@core/models/structure';
import { NormalizedModule } from '@core/models/normalizedModule';
import { Anomalia } from '@core/models/anomalia';

@Component({
  selector: 'app-map-classification',
  templateUrl: './map-classification.component.html',
  styleUrls: ['./map-classification.component.css'],
})
export class MapClassificationComponent implements OnInit {
  private planta: PlantaInterface;
  private map: Map;
  private thermalLayer: ThermalLayerInterface;
  private thermalLayers: TileLayer[];
  private normModules: Structure[];
  private popup: Overlay;
  private listaAnomalias: Anomalia[] = [];
  private normModLayer: VectorLayer = undefined;

  constructor(
    private classificationService: ClassificationService,
    private informeService: InformeService,
    private olMapService: OlMapService,
    private thermalService: ThermalService,
    private structuresService: StructuresService
  ) {}

  ngOnInit(): void {
    this.planta = this.classificationService.planta;

    const informeId = this.classificationService.informeId;

    // nos conectamos a la lista de anomalias
    this.classificationService.listaAnomalias$.subscribe((lista) => {
      this.listaAnomalias = lista;

      if (this.normModLayer !== undefined) {
        this.normModLayer.setStyle(this.getStyleNormMod());
      }
    });

    this.informeService
      .getThermalLayer$(informeId)
      .pipe(take(1))
      .subscribe((layers) => {
        // nos suscribimos a las capas termicas del mapa
        this.olMapService.getThermalLayers().subscribe((tLayers) => (this.thermalLayers = tLayers));

        // esta es la thermalLayer de la DB
        this.thermalLayer = layers[0];

        this.olMapService.addThermalLayer(this.createThermalLayer(this.thermalLayer, informeId));

        this.initMap();

        this.createNormModLayer();
        this.addNormModules();

        this.addPopupOverlay();

        this.addPointerOnHover();
        // this.addSelectNormModInteraction();
        this.addOnDoubleClickInteraction();
        this.addClickOutFeatures();
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
        },
      }),

      // extent: this.extent1,
    });
    tl.setProperties({
      informeId,
    });

    return tl;
  }

  private createNormModLayer() {
    this.normModLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleNormMod(),
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

      this.normModules.forEach((normM) => {
        const coords = this.objectToCoordinate(normM.coords);

        const normMod: NormalizedModule = { id: normM.id, fila: 4, columna: 10, coords: normM.coords };

        const feature = new Feature({
          geometry: new Polygon([coords]),
          properties: {
            id: normM.id,
            name: 'normMod',
            normMod,
          },
        });

        normModsSource.addFeature(feature);
      });
    });
  }

  private objectToCoordinate(coords: any) {
    const coordsOK: Coordinate[] = [
      [coords.topLeft.long, coords.topLeft.lat],
      [coords.topRight.long, coords.topRight.lat],
      [coords.bottomRight.long, coords.bottomRight.lat],
      [coords.bottomLeft.long, coords.bottomLeft.lat],
    ];

    return coordsOK;
  }

  initMap() {
    const satellite = new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: '',
    });
    const satelliteLayer = new TileLayer({
      source: satellite,
    });

    const aerial = new XYZ({
      url: 'https://solardrontech.es/demo_rgb/{z}/{x}/{y}.png',
      crossOrigin: '',
    });

    const aerialLayer = new TileLayer({
      source: aerial,
    });

    const layers = [satelliteLayer, ...this.thermalLayers];

    // MAPA
    const view = new View({
      center: fromLonLat([this.planta.longitud, this.planta.latitud]),
      // zoom: 18,
      zoom: this.planta.zoom,
      minZoom: this.planta.zoom,
      maxZoom: this.planta.zoom + 5,
    });

    this.olMapService
      .createMap('map', layers, view, defaultControls({ attribution: false }))
      .pipe(take(1))
      .subscribe((map) => {
        this.map = map;
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

        const coords = this.objectToCoordinate(feature.getProperties().properties.normMod.coords);

        this.popup.setPosition(coords[2]);

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

  private getStyleNormMod() {
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
              width: 2,
            }),
            fill: new Fill({
              color: 'rgba(0,0,0,0)',
            }),
          });
        } else {
          return new Style({
            stroke: new Stroke({
              color: 'white',
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
}
