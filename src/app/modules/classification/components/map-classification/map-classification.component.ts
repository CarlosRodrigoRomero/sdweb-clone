import { Component, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control.js';
import { Feature, Map } from 'ol';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import Polygon from 'ol/geom/Polygon';
import { Coordinate } from 'ol/coordinate';
import { DoubleClickZoom, Select, Translate } from 'ol/interaction';
import { OSM } from 'ol/source';
import { click } from 'ol/events/condition';
import LineString from 'ol/geom/LineString';
import VectorImageLayer from 'ol/layer/VectorImage';

import moment from 'moment';

import XYZ_mod from '@shared/modules/ol-maps/xyz_mod.js';

import { ClassificationService } from '@data/services/classification.service';
import { OlMapService } from '@data/services/ol-map.service';
import { ThermalService } from '@data/services/thermal.service';
import { StructuresService } from '@data/services/structures.service';
import { ClustersService } from '@data/services/clusters.service';
import { AnomaliaService } from '@data/services/anomalia.service';

import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { PlantaInterface } from '@core/models/planta';
import { NormalizedModule } from '@core/models/normalizedModule';
import { Anomalia } from '@core/models/anomalia';

import { COLOR } from '@data/constants/color';
import { PALETTE } from '@data/constants/palette';
import { InformeInterface } from '@core/models/informe';
import { Patches } from '@core/classes/patches';

@Component({
  selector: 'app-map-classification',
  templateUrl: './map-classification.component.html',
  styleUrls: ['./map-classification.component.css'],
})
export class MapClassificationComponent implements OnInit {
  private planta: PlantaInterface;
  private informe: InformeInterface;
  private map: Map;
  private thermalLayerDB: ThermalLayerInterface;
  private thermalLayers: TileLayer<any>[];
  private normModules: NormalizedModule[];
  private listaAnomalias: Anomalia[] = [];
  private anomsLayer: VectorImageLayer<any> = undefined;
  private prevFeatureHover: Feature<any>;
  thermalLayerVisibility = true;
  private palette = PALETTE.ironPalette;
  normModSelected: NormalizedModule;
  anomaliaSelected: Anomalia;
  public showAnomOk = false;
  private aerialLayer: TileLayer<any>;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private classificationService: ClassificationService,
    private olMapService: OlMapService,
    private thermalService: ThermalService,
    private structuresService: StructuresService,
    private clustersService: ClustersService,
    private anomaliaService: AnomaliaService
  ) {}

  ngOnInit(): void {
    this.planta = this.classificationService.planta;

    this.informe = this.classificationService.informe;

    // aplicamos estilos cada vez que se modifica una anomalia
    this.classificationService.anomaliaSelected$.subscribe((anomalia) => {
      this.anomaliaSelected = anomalia;

      // if (anomalia !== undefined) {
      //   if (this.anomsLayer !== undefined) {
      //     this.anomsLayer.setStyle(this.getStyleAnoms(false));
      //   }
      // }
    });

    this.normModules = this.classificationService.normModules;

    this.classificationService.normModSelected$.subscribe((normMod) => (this.normModSelected = normMod));

    this.subscriptions.add(this.olMapService.aerialLayers$.subscribe((layers) => (this.aerialLayer = layers[0])));

    // añadimos las ortofotos aereas de cada informe
    this.olMapService.addAerialLayer(this.informe);

    this.thermalService
      .getReportThermalLayerDB(this.informe.id)
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
          this.thermalLayerDB = layers[0];

          if (this.thermalLayerDB !== undefined) {
            const thermalLayer = this.olMapService.createThermalLayer(this.thermalLayerDB, this.informe, 0);

            this.olMapService.addThermalLayer(thermalLayer);
          }

          this.initMap();

          this.createAnomsLayer();
          this.addAnoms();

          this.addPointerOnHover();
          this.addOnHoverAction();
          this.addOnDoubleClickInteraction();
          this.addSelectInteraction();
          this.addClickOutFeatures();
        } else {
          this.initMap();
        }
      });
  }

  initMap() {
    const osmLayer = new TileLayer({
      source: new OSM(),
    });

    const layers = [osmLayer, this.aerialLayer, ...this.thermalLayers];

    // MAPA
    const view = new View({
      center: fromLonLat([this.planta.longitud, this.planta.latitud]),
      zoom: this.planta.zoom,
      minZoom: this.planta.zoom - 2,
      maxZoom: 24,
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

  private createAnomsLayer() {
    this.anomsLayer = new VectorImageLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleAnoms(false),
    });

    this.anomsLayer.setProperties({
      id: 'anomsLayer',
    });

    this.map.addLayer(this.anomsLayer);
  }

  private addAnoms() {
    const anomsSource = this.anomsLayer.getSource();

    this.classificationService.listaAnomalias$.subscribe((anoms) => {
      anomsSource.clear();

      this.listaAnomalias = anoms;

      this.listaAnomalias.forEach((anom) => {
        const feature = new Feature({
          geometry: new Polygon([anom.featureCoords]),
          properties: {
            id: anom.id,
            name: 'anom',
            tipo: anom.tipo,
          },
        });

        anomsSource.addFeature(feature);
      });
    });
  }

  private addPointerOnHover() {
    this.map.on('pointermove', (event) => {
      if (this.map.hasFeatureAtPixel(event.pixel)) {
        let feature = this.map
          .getFeaturesAtPixel(event.pixel)
          .filter((item) => item.getProperties().properties !== undefined);
        feature = feature.filter((item) => item.getProperties().properties.name === 'anom');

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
    let currentFeatureHover: Feature<any>;
    this.map.on('pointermove', (event) => {
      // impedimos hover cuando estamos moviendo una anomalia
      if (this.classificationService.normModAnomaliaSelected === undefined) {
        if (this.map.hasFeatureAtPixel(event.pixel)) {
          const feature: Feature<any> = this.map
            .getFeaturesAtPixel(event.pixel)
            .filter((item) => item.getProperties().properties !== undefined)
            .filter((item) => item.getProperties().properties.name === 'anom')[0] as Feature<any>;

          if (feature !== undefined) {
            // cuando pasamos de un modulo a otro directamente sin pasar por vacio
            if (this.prevFeatureHover !== undefined && this.prevFeatureHover !== feature) {
              // quitamos el efecto resaltado
              this.prevFeatureHover.setStyle(this.getStyleAnoms(false));
              this.prevFeatureHover = undefined;
            }
            currentFeatureHover = feature;

            // aplicamos el efecto resaltado
            feature.setStyle(this.getStyleAnoms(true));

            const anomalia = this.listaAnomalias.find((anom) => anom.id === feature.getProperties().properties.id);

            this.classificationService.anomaliaHovered = anomalia;

            this.prevFeatureHover = feature;
          } else {
            this.classificationService.anomaliaHovered = undefined;
          }
        } else {
          if (currentFeatureHover !== undefined) {
            // quitamos el efecto resaltado
            currentFeatureHover.setStyle(this.getStyleAnoms(false));
            currentFeatureHover = undefined;

            this.classificationService.anomaliaHovered = undefined;
          }
        }
      }
    });
  }

  private addOnDoubleClickInteraction() {
    this.map.on('dblclick', (event) => {
      const coordsClick = this.map.getCoordinateFromPixel(event.pixel);

      const normModule = this.getNormModuleFromClick(coordsClick);

      if (normModule !== null) {
        const date = this.getDatetime();

        this.classificationService.createAnomaliaFromNormModule(normModule, date);
      }
    });
  }

  private addSelectInteraction() {
    const select = new Select({
      style: this.getStyleAnoms(true),
      condition: click,
      layers: (l) => {
        if (l.getProperties().id === 'anomsLayer') {
          return true;
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

      // actualizamos la anomalia en la lista
      this.classificationService.listaAnomalias = this.classificationService.listaAnomalias.map((anom) => {
        if (anom.id === this.anomaliaSelected.id) {
          anom.featureCoords = [...newCoords[0]];
        }
        return anom;
      });

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

  private getDatetime() {
    let dateString = Patches.applyPatches(this.classificationService.informeId);

    if (dateString === undefined) {
      dateString = this.informe.fecha + 50400; // sumamos 14 horas
      // dateString = this.getClosestPoint(coords);
    }

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

  private getClosestNormModule(coordsClick: Coordinate): NormalizedModule {
    return this.classificationService.normModules.reduce((closestModule, currentModule) => {
      const centroidNormMod = [currentModule.centroid_gps.long, currentModule.centroid_gps.lat] as Coordinate;
      const currentDistance = this.calculateDistance(coordsClick, centroidNormMod);

      if (!closestModule) return currentModule;

      const closestCentroid = [closestModule.centroid_gps.long, closestModule.centroid_gps.lat] as Coordinate;
      const closestDistance = this.calculateDistance(coordsClick, closestCentroid);

      return currentDistance < closestDistance ? currentModule : closestModule;
    }, null as NormalizedModule | null);
  }

  private getNormModuleFromClick(coordsClick: Coordinate): NormalizedModule | null {
    return (
      this.classificationService.normModules.find((normMod) => {
        const coords = this.structuresService.coordsDBToCoordinate(normMod.coords);
        const polygon = new Polygon([coords]);
        return polygon.intersectsCoordinate(coordsClick);
      }) || null
    );
  }

  private calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
    const dx = coord1[0] - coord2[0];
    const dy = coord1[1] - coord2[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  private dateStringToUnix(date: string) {
    const unix = moment(date, 'DD/MM/YYYY hh:mm:ss').unix();

    return unix;
  }

  private getStyleAnoms(hovered: boolean) {
    return (feature) => {
      const TRANSPARENT_COLOR = 'rgba(0,0,0,0)';
      const DEFAULT_WIDTH = 2;
      const HOVER_WIDTH = 4;

      // Comprobar si la característica tiene propiedades válidas
      const featureProps = feature?.getProperties()?.properties;
      if (!featureProps) return;

      return new Style({
        stroke: new Stroke({
          color: COLOR.colores_tipos[featureProps.tipo],
          width: hovered ? HOVER_WIDTH : DEFAULT_WIDTH,
        }),
        fill: new Fill({
          color: TRANSPARENT_COLOR,
        }),
      });
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
    if (this.palette === PALETTE.ironPalette) {
      this.palette = PALETTE.grayScalePalette;
    } else {
      this.palette = PALETTE.ironPalette;
    }

    this.map
      .getLayers()
      .getArray()
      .filter((layer) => layer.getProperties().name !== undefined && layer.getProperties().name === 'thermalLayer')
      .forEach((layer) => {
        const thermalLayerDB: ThermalLayerInterface = layer.getProperties().layerDB;

        ((layer as TileLayer<any>).getSource() as XYZ_mod).setTileLoadFunction((imageTile, src) => {
          imageTile.rangeTempMax = thermalLayerDB.rangeTempMax;
          imageTile.rangeTempMin = thermalLayerDB.rangeTempMin;
          imageTile.palette = this.palette;
          imageTile.thermalService = this.thermalService;
          imageTile.getImage().src = src;
          imageTile.thermalLayer = thermalLayerDB;
          imageTile.index = 0;
        });
      });
  }
}
