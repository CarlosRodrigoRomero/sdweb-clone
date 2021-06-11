import { Component, OnInit } from '@angular/core';

import { switchMap, take } from 'rxjs/operators';

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

@Component({
  selector: 'app-map-structures',
  templateUrl: './map-structures.component.html',
  styleUrls: ['./map-structures.component.css'],
})
export class MapStructuresComponent implements OnInit {
  private planta: PlantaInterface;
  private informeId: string = undefined;
  private map: Map;
  private satelliteLayer: TileLayer;
  public thermalSource;
  private thermalLayer: TileLayer = undefined;
  private thermalLayerDB: ThermalLayerInterface;
  private thermalLayers: TileLayer[];
  private modulosBrutos: RawModule[];
  private deleteMode = false;
  private mBDeletedIds: string[] = [];
  public layerVisibility = true;

  constructor(
    private olMapService: OlMapService,
    private structuresService: StructuresService,
    private informeService: InformeService,
    private thermalService: ThermalService,
    private filterService: FilterService
  ) {}

  ngOnInit(): void {
    this.planta = this.structuresService.planta;

    this.structuresService.deleteMode$.subscribe((mode) => (this.deleteMode = mode));

    this.structuresService.deletedRawModIds$.subscribe((ids) => (this.mBDeletedIds = ids));

    this.informeId = this.structuresService.informeId;

    this.informeService
      .getThermalLayerDB$(this.informeId)
      .pipe(take(1))
      .subscribe((layersDB) => {
        // nos suscribimos a las capas termicas del mapa
        this.olMapService.getThermalLayers().subscribe((tLayers) => (this.thermalLayers = tLayers));

        // esta es la thermalLayer de la DB
        this.thermalLayerDB = layersDB[0];

        this.thermalLayer = this.createThermalLayer(this.thermalLayerDB, this.informeId);

        this.olMapService.addThermalLayer(this.thermalLayer);

        this.initMap();

        this.createModulosBrutosLayer();
        this.addModulosBrutos();

        this.addPointerOnHover();
        this.addSelectModuloBrutoInteraction();
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

    this.olMapService
      .createMap('map', layers, view, defaultControls({ attribution: false }))
      .pipe(take(1))
      .subscribe((map) => {
        this.map = map;
      });
  }

  private createThermalLayer(thermalLayer: ThermalLayerInterface, informeId: string): TileLayer {
    // Iniciar mapa térmico
    const source = new XYZ_mod({
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
      .pipe(
        switchMap((modulos) => {
          // asignamos todos los modulos
          this.structuresService.allRawModules = modulos;

          // calculamos las medias y desviaciones
          this.structuresService.setAveragesAndStandardDeviations();

          return this.filterService.initService(this.planta.id, true, modulos);
        })
      )
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
                if (filtParams.length > 0) {
                  this.structuresService.applyFilters(filtParams);

                  this.structuresService.deletedRawModIds = filtParams[0].eliminados;
                  // this.mBDeletedIds = filtParams[0].eliminados;
                }

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

  setLayerVisibility() {
    this.layerVisibility = !this.layerVisibility;
    this.map
      .getLayers()
      .getArray()
      .filter((layer) => layer.getProperties().id === undefined || layer.getProperties().id !== 'mBLayer')
      .forEach((layer) => layer.setVisible(this.layerVisibility));
  }
}
