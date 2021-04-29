import { Component, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';

import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import View from 'ol/View';
import { Feature, Map } from 'ol';
import { fromLonLat, transformExtent } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Stroke, Style } from 'ol/style';

import ImageTileMod from '@shared/modules/ol-maps/ImageTileMod.js';
import XYZ_mod from '@shared/modules/ol-maps/xyz_mod.js';

import { OlMapService } from '@core/services/ol-map.service';
import { StructuresService } from '@core/services/structures.service';
import { InformeService } from '@core/services/informe.service';
import { GLOBAL } from '@core/services/global';
import { ThermalService } from '@core/services/thermal.service';

import { PlantaInterface } from '@core/models/planta';
import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { ModuloBruto } from '@core/models/moduloBruto';
import Polygon from 'ol/geom/Polygon';

@Component({
  selector: 'app-map-structures',
  templateUrl: './map-structures.component.html',
  styleUrls: ['./map-structures.component.css'],
})
export class MapStructuresComponent implements OnInit {
  private planta: PlantaInterface;
  private map: Map;
  private satelliteLayer: TileLayer;
  private aerialLayer: TileLayer;
  public thermalSource;
  private thermalLayer: ThermalLayerInterface;
  private thermalLayers: TileLayer[];
  private extent1: any;
  private modulosBrutos: ModuloBruto[];

  constructor(
    private olMapService: OlMapService,
    private structuresService: StructuresService,
    private informeService: InformeService,
    private thermalService: ThermalService
  ) {}

  ngOnInit(): void {
    // Para la demo, agregamos un extent a todas las capas:
    this.extent1 = this.transform([-7.0608, 38.523619, -7.056351, 38.522765]);

    this.planta = this.structuresService.planta;

    const informeId = this.structuresService.informeId;

    this.informeService
      .getThermalLayer$(informeId)
      .pipe(take(1))
      .subscribe((layers) => {
        this.olMapService.getThermalLayers().subscribe((tLayers) => (this.thermalLayers = tLayers));

        this.thermalLayer = layers[0];

        this.olMapService.addThermalLayer(this.createThermalLayer(this.thermalLayer, informeId));

        this.initMap();

        this.createModulosBrutosLayer();
        this.addModulosBrutos();
      });
  }

  initMap() {
    const satellite = new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: '',
    });
    this.satelliteLayer = new TileLayer({
      source: satellite,
    });

    const aerial = new XYZ({
      url: 'https://solardrontech.es/demo_rgb/{z}/{x}/{y}.png',
      crossOrigin: '',
    });

    this.aerialLayer = new TileLayer({
      source: aerial,
    });

    const layers = [this.satelliteLayer, ...this.thermalLayers];

    // MAPA
    const view = new View({
      center: fromLonLat([this.planta.longitud, this.planta.latitud]),
      // zoom: 18,
      zoom: this.planta.zoom,
      minZoom: this.planta.zoom,
      maxZoom: this.planta.zoom + 3,
      // extent: this.transform([-7.060903, 38.523993, -7.0556, 38.522264]),
    });

    this.olMapService
      .createMap('map', layers, view, defaultControls({ attribution: false }))
      .pipe(take(1))
      .subscribe((map) => {
        this.map = map;
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

  private createModulosBrutosLayer() {
    const mBLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: new Style({
        stroke: new Stroke({
          width: 2,
          color: 'white',
        }),
      }),
    });

    mBLayer.setProperties({
      id: 'mBLayer',
    });

    this.map.addLayer(mBLayer);
  }

  private addModulosBrutos() {
    this.thermalService.getModulosBrutos(this.thermalLayer.id).subscribe((modulos) => {
      this.modulosBrutos = modulos;
      const mBLayer = this.map
        .getLayers()
        .getArray()
        .find((layer) => layer.getProperties().id === 'mBLayer') as VectorLayer;
      const mBSource = mBLayer.getSource();

      console.log(this.modulosBrutos);

      this.modulosBrutos.forEach((mB) => {
        const feature = new Feature({
          geometry: new Polygon([mB.coords]),
        });

        mBSource.addFeature(feature);
      });
    });
  }

  private transform(extent) {
    return transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
  }
}
