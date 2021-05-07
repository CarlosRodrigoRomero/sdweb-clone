import { Component, OnInit } from '@angular/core';

import { switchMap, take } from 'rxjs/operators';

import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import View from 'ol/View';
import { Feature, Map } from 'ol';
import { fromLonLat, transformExtent } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import Polygon from 'ol/geom/Polygon';

import ImageTileMod from '@shared/modules/ol-maps/ImageTileMod.js';
import XYZ_mod from '@shared/modules/ol-maps/xyz_mod.js';

import { OlMapService } from '@core/services/ol-map.service';
import { StructuresService } from '@core/services/structures.service';
import { InformeService } from '@core/services/informe.service';
import { GLOBAL } from '@core/services/global';
import { ThermalService } from '@core/services/thermal.service';
import { FilterService } from '@core/services/filter.service';

import { PlantaInterface } from '@core/models/planta';
import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { RawModule } from '@core/models/moduloBruto';
import { Select } from 'ol/interaction';
import { click } from 'ol/events/condition';
import { combineLatest } from 'rxjs';
import { Coordinate } from 'ol/coordinate';

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
  private modulosBrutos: RawModule[];
  private deleteMode = false;
  private mBDeletedIds: string[] = [];

  constructor(
    private olMapService: OlMapService,
    private structuresService: StructuresService,
    private informeService: InformeService,
    private thermalService: ThermalService,
    private filterService: FilterService
  ) {}

  ngOnInit(): void {
    // Para la demo, agregamos un extent a todas las capas:
    this.extent1 = this.transform([-7.0608, 38.523619, -7.056351, 38.522765]);

    this.planta = this.structuresService.planta;

    this.structuresService.deleteMode$.subscribe((mode) => (this.deleteMode = mode));

    this.structuresService.deletedRawModIds$.subscribe((ids) => (this.mBDeletedIds = ids));

    const informeId = this.structuresService.informeId;

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

        this.createModulosBrutosLayer();
        this.addModulosBrutos();

        this.addPointerOnHover();
        this.addSelectModuloBrutoInteraction();
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
    this.structuresService
      .getModulosBrutos()
      .pipe(switchMap((modulos) => this.filterService.initService(this.planta.id, true, modulos)))
      .subscribe((init) => {
        if (init) {
          const mBLayer = this.map
            .getLayers()
            .getArray()
            .find((layer) => layer.getProperties().id === 'mBLayer') as VectorLayer;
          const mBSource = mBLayer.getSource();

          this.structuresService
            .getFiltersParams()
            .pipe(
              switchMap((filtParams) => {
                this.structuresService.applyFilters(filtParams);

                this.structuresService.deletedRawModIds = filtParams[0].eliminados;
                // this.mBDeletedIds = filtParams[0].eliminados;

                return this.filterService.filteredElements$;
              })
            )
            .subscribe((elems) => {
              mBSource.clear();

              if (this.mBDeletedIds) {
                this.modulosBrutos = (elems as RawModule[]).filter((mB) => !this.mBDeletedIds.includes(mB.id));
              } else {
                this.modulosBrutos = elems as RawModule[];
              }

              this.modulosBrutos.forEach((mB) => {
                const feature = new Feature({
                  geometry: new Polygon([mB.coords]),
                  properties: {
                    id: mB.id,
                    name: 'moduloBruto',
                  },
                });

                mBSource.addFeature(feature);
              });
            });
        }
      });
  }

  private addPointerOnHover() {
    this.map.on('pointermove', (event) => {
      if (this.deleteMode) {
        if (this.map.hasFeatureAtPixel(event.pixel)) {
          let feature = this.map
            .getFeaturesAtPixel(event.pixel)
            .filter((item) => item.getProperties().properties !== undefined);
          feature = feature.filter((item) => item.getProperties().properties.name === 'moduloBruto');

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
      }
    });
  }

  private addSelectModuloBrutoInteraction() {
    const select = new Select({
      style: new Style({
        fill: new Fill({
          color: 'rgba(0,0,0,0)',
        }),
      }),
      condition: click,
      layers: (l) => {
        if (l.getProperties().id === 'mBLayer') {
          return true;
        } else {
          return false;
        }
      },
    });

    this.map.addInteraction(select);

    select.on('select', (e) => {
      if (this.deleteMode) {
        if (e.selected.length > 0) {
          if (e.selected[0].getProperties().properties.name === 'moduloBruto') {
            let deletedIds: string[];
            if (this.mBDeletedIds !== undefined) {
              deletedIds = this.mBDeletedIds.concat(e.selected[0].getProperties().properties.id);
            } else {
              deletedIds = [e.selected[0].getProperties().properties.id];
            }

            this.structuresService.addFilter('eliminados', deletedIds);
          }
        }
      }
    });
  }

  private transform(extent) {
    return transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
  }
}
