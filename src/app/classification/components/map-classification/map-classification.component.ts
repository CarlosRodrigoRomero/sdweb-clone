import { Component, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';

import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control.js';
import { Feature, Map } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Stroke, Style } from 'ol/style';
import Polygon from 'ol/geom/Polygon';
import { Coordinate } from 'ol/coordinate';

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
  private structures: Structure[];

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

        this.createStructuresLayer();
        this.addStructures();
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

  private createStructuresLayer() {
    const structLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: new Style({
        stroke: new Stroke({
          width: 2,
          color: 'white',
        }),
      }),
    });

    structLayer.setProperties({
      id: 'structLayer',
    });

    this.map.addLayer(structLayer);
  }

  private addStructures() {
    this.structuresService.getStructures(this.thermalLayer).subscribe((structures) => {
      const structLayer = this.map
        .getLayers()
        .getArray()
        .find((layer) => layer.getProperties().id === 'structLayer') as VectorLayer;

      const structSource = structLayer.getSource();

      structSource.clear();

      this.structures = structures;

      this.structures.forEach((struct) => {
        const coords = this.objectToCoordinate(struct.coords);

        const feature = new Feature({
          geometry: new Polygon([coords]),
          properties: {
            id: struct.id,
            name: 'structure',
          },
        });

        structSource.addFeature(feature);
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
}
