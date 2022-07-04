import { Component, OnDestroy, OnInit } from '@angular/core';

import { switchMap, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import View from 'ol/View';
import { Feature, Map } from 'ol';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import Polygon from 'ol/geom/Polygon';
import { Select } from 'ol/interaction';
import { click } from 'ol/events/condition';
import { OSM, Source } from 'ol/source';
import { FeatureLike } from 'ol/Feature';

import ImageTileMod from '@shared/modules/ol-maps/ImageTileMod.js';
import XYZ_mod from '@shared/modules/ol-maps/xyz_mod.js';

import { OlMapService } from '@data/services/ol-map.service';
import { StructuresService } from '@data/services/structures.service';
import { InformeService } from '@data/services/informe.service';
import { GLOBAL } from '@data/constants/global';
import { ThermalService } from '@data/services/thermal.service';
import { FilterService } from '@data/services/filter.service';

import { PlantaInterface } from '@core/models/planta';
import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { RawModule } from '@core/models/moduloBruto';

@Component({
  selector: 'app-map-structures',
  templateUrl: './map-structures.component.html',
  styleUrls: ['./map-structures.component.css'],
})
export class MapStructuresComponent implements OnInit, OnDestroy {
  private planta: PlantaInterface;
  private informeId: string = undefined;
  private map: Map;
  private satelliteLayer: TileLayer;
  public thermalSource;
  private thermalLayer: TileLayer = undefined;
  private thermalLayerDB: ThermalLayerInterface;
  private thermalLayers: TileLayer[];
  private rawMods: RawModule[];
  private deleteMode = false;
  private rawModDeletedIds: string[] = [];
  public layerVisibility = true;
  private prevFeatureHover: Feature;
  private rawModLayer: VectorLayer;
  endFilterSubscription = false;
  public rawModHovered: RawModule;

  private subscriptionFilters: Subscription = new Subscription();
  private subscriptions: Subscription = new Subscription();

  constructor(
    private olMapService: OlMapService,
    private structuresService: StructuresService,
    private informeService: InformeService,
    private thermalService: ThermalService,
    private filterService: FilterService
  ) {}

  ngOnInit(): void {
    this.planta = this.structuresService.planta;

    this.subscriptions.add(
      this.structuresService.endFilterSubscription$.subscribe((end) => {
        if (end) {
          this.subscriptionFilters.unsubscribe();
        }
      })
    );

    this.subscriptions.add(this.structuresService.deleteRawModMode$.subscribe((mode) => (this.deleteMode = mode)));

    this.subscriptions.add(this.structuresService.deletedRawModIds$.subscribe((ids) => (this.rawModDeletedIds = ids)));

    this.informeId = this.structuresService.informeId;

    this.thermalService
      .getReportThermalLayerDB(this.informeId)
      .pipe(take(1))
      .subscribe((layersDB) => {
        // nos suscribimos a las capas termicas del mapa
        this.subscriptions.add(
          this.olMapService.getThermalLayers().subscribe((tLayers) => (this.thermalLayers = tLayers))
        );

        // esta es la thermalLayer de la DB
        this.thermalLayerDB = layersDB[0];

        this.thermalLayer = this.createThermalLayer(this.thermalLayerDB, this.informeId);

        this.olMapService.addThermalLayer(this.thermalLayer);

        this.initMap();
      });
  }

  initMap() {
    const osmLayer = new TileLayer({
      source: new OSM(),
    });

    osmLayer.setProperties({ name: 'osm' });

    const aerial = new XYZ({
      url: 'http://solardrontech.es/tileserver.php?/index.json?/' + this.informeId + '_visual/{z}/{x}/{y}.png',
      crossOrigin: '',
    });

    const aerialLayer = new TileLayer({
      source: aerial,
    });

    aerialLayer.setProperties({ name: 'aerial' });

    const layers = [osmLayer, aerialLayer, ...this.thermalLayers];

    // MAPA
    const view = new View({
      center: fromLonLat([this.planta.longitud, this.planta.latitud]),
      zoom: this.planta.zoom,
      minZoom: this.planta.zoom - 2,
      maxZoom: this.planta.zoom + 8,
    });

    this.olMapService.createMap('map', layers, view, defaultControls({ attribution: false })).subscribe((map) => {
      this.map = map;
    });
  }

  private createThermalLayer(thermalLayer: ThermalLayerInterface, informeId: string): TileLayer {
    // Iniciar mapa térmico
    const source = new XYZ_mod({
      url: GLOBAL.GIS + thermalLayer.gisName + '/{z}/{x}/{y}.png',
      crossOrigin: 'anonymous',
      tileClass: ImageTileMod,
      tileLoadFunction: (imageTile, src) => {
        imageTile.rangeTempMax = thermalLayer.rangeTempMax;
        imageTile.rangeTempMin = thermalLayer.rangeTempMin;
        imageTile.thermalService = this.thermalService;
        imageTile.getImage().src = src;
        imageTile.thermalLayer = thermalLayer;
        imageTile.index = 0;
      },
    });

    // source.on('tileloadend', () => this.thermalNotExist$.next(false));

    const tl = new TileLayer({
      source,
    });

    tl.setProperties({
      informeId,
    });

    return tl;
  }

  setLayerVisibility() {
    this.layerVisibility = !this.layerVisibility;
    this.map
      .getLayers()
      .getArray()
      .filter(
        (layer) =>
          layer.getProperties().id === undefined ||
          (layer.getProperties().id !== 'rawModLayer' && layer.getProperties().id !== 'normModLayer')
      )
      .forEach((layer) => layer.setVisible(this.layerVisibility));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.subscriptionFilters.unsubscribe();
  }
}
