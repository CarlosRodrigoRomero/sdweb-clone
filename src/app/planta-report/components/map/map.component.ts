import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { take } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import { fromLonLat, transformExtent } from 'ol/proj.js';
import View from 'ol/View';
import GeoJSON from 'ol/format/GeoJSON';
import { Fill, Stroke, Style, Text } from 'ol/style';
import Select from 'ol/interaction/Select';
import { Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { Feature, Overlay } from 'ol';
import Polygon from 'ol/geom/Polygon';
import { defaults as defaultControls } from 'ol/control.js';
import Zoom from 'ol/control/Zoom';
import OverlayPositioning from 'ol/OverlayPositioning';
import { click } from 'ol/events/condition';
import XYZ from 'ol/source/XYZ';

import ImageTileMod from '../../ImageTileMod.js';
import XYZ_mod from '../../xyz_mod.js';

import { PlantaService } from '@core/services/planta.service';
import { MapControlService } from '../../services/map-control.service';
import { GLOBAL } from '@core/services/global';
import { InformeService } from '@core/services/informe.service';
import { FilterService } from '@core/services/filter.service';
import { OlMapService } from '@core/services/ol-map.service';
import { ShareReportService } from '@core/services/share-report.service';

import { PlantaInterface } from '@core/models/planta';
import { LocationAreaInterface } from '@core/models/location';
import { Anomalia } from '@core/models/anomalia';
import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { PlantaAddComponent } from 'src/app/clientes/components/planta-add/planta-add.component.js';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit {
  public plantaId: string;
  public planta: PlantaInterface;
  public map: Map;
  public rangeMin: number;
  public rangeMax: number;
  public palleteJSON: string;
  public selectedInformeId: string;
  public anomaliasVectorSource: VectorSource;
  public locAreasVectorSource: VectorSource;
  public anomaliaSeleccionada: Anomalia;
  public listaAnomalias: Anomalia[];
  public sliderYear: number;
  public aerialLayer: TileLayer;
  private extent1: any;
  public thermalSource;
  private thermalLayers: TileLayer[];
  private anomaliaLayers: VectorLayer[];
  public leftOpened: boolean;
  public rightOpened: boolean;
  public statsOpened: boolean;
  public anomaliasLoaded = false;
  public mousePosition;
  public informesList: string[] = [];
  public sharedReport = false;

  constructor(
    public mapControlService: MapControlService,
    private plantaService: PlantaService,
    private informeService: InformeService,
    public filterService: FilterService,
    private olMapService: OlMapService,
    private shareReportService: ShareReportService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    if (this.router.url.includes('shared')) {
      this.sharedReport = true;
    }
  }

  ngOnInit(): void {
    this.mousePosition = null;

    // Para la demo, agregamos un extent a todas las capas:
    this.extent1 = this.transform([-7.0608, 38.523619, -7.056351, 38.522765]);

    /* this.plantaId = 'egF0cbpXnnBnjcrusoeR'; */
    /* this.informesList = ['4ruzdxY6zYxvUOucACQ0', 'vfMHFBPvNFnOFgfCgM9L']; */
    this.plantaId = this.activatedRoute.snapshot.paramMap.get('id');
    // Obtenemos todas las capas para esta planta, incluidas las termicas si es tipo "fija" y las almacenamos en this.thermalLayers
    combineLatest([
      this.plantaService.getThermalLayers$(this.plantaId),
      this.informeService.getInformesDePlanta(this.plantaId),
      this.plantaService.getPlanta(this.plantaId),
    ])
      .pipe(take(1))
      .subscribe(([thermalLayers, informes, planta]) => {
        this.olMapService.getThermalLayers().subscribe((layers) => (this.thermalLayers = layers));
        this.olMapService.getAnomaliaLayers().subscribe((layers) => (this.anomaliaLayers = layers));

        // Para cada informe, hay que crear 2 capas: térmica y vectorial
        informes
          .sort((a, b) => a.fecha - b.fecha)
          .forEach((informe) => {
            // Crear capa térmica si es planta tipo "fija"
            if (planta.tipo !== 'seguidores') {
              const tl = thermalLayers.filter((item) => item.informeId === informe.id);

              // TODO: Comprobar que existe...
              if (tl.length > 0) {
                this.olMapService.addThermalLayer(this._createThermalLayer(tl[0], informe.id));
              }
            }
            this.informesList.push(informe.id);

            // crear capa de las anomalias
            this.olMapService.addAnomaliaLayer(this._createAnomaliaLayer(informe.id));
          });

        this.planta = planta;

        // seleccionamos el informe mas reciente de la planta
        this.selectedInformeId = this.informesList[this.informesList.length - 1];

        // asignamos el informe para compartir
        this.shareReportService.setInformeID(this.informesList[this.informesList.length - 1]);

        this.mapControlService.selectedInformeId = this.informesList[this.informesList.length - 1];

        this.initMap();
      });
  }

  private _createThermalLayer(thermalLayer: ThermalLayerInterface, informeId: string): TileLayer {
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
          imageTile.mapControlService = this.mapControlService;
          imageTile.getImage().src = src;
        },
      }),

      extent: this.extent1,
    });
    tl.setProperties({
      informeId,
    });

    return tl;
  }

  private _createAnomaliaLayer(informeId: string): VectorLayer {
    const vl = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleAnomaliasMapa(false),
    });

    vl.setProperties({
      informeId,
    });

    return vl;
  }

  initMap() {
    const satellite = new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: '',
    });
    const aerial = new XYZ({
      url: 'https://solardrontech.es/demo_rgb/{z}/{x}/{y}.png',
      crossOrigin: '',
    });

    this.aerialLayer = new TileLayer({
      source: aerial,
      extent: this.extent1,
    });
    const osmLayer = new TileLayer({
      // source: satellite,
      source: new OSM(),
      // extent: this.extent1,
    });

    const layers = [osmLayer, this.aerialLayer, ...this.thermalLayers];

    // MAPA
    const view = new View({
      center: fromLonLat([this.planta.longitud, this.planta.latitud]),
      zoom: 18,
      // zoom: this.planta.zoom,
      maxZoom: 24,
      // para la demo
      extent: this.transform([-7.060903, 38.523993, -7.0556, 38.522264]),
    });

    this.olMapService
      .createMap('map', layers, view, defaultControls({ attribution: false }))
      .subscribe((map) => (this.map = map));

    this.anomaliaLayers.forEach((l) => this.map.addLayer(l));
    this.addCursorOnHover();
    this.addOverlayInfoAnomalia();
    if (!this.sharedReport) {
      this.addLocationAreas();
    }
    // this.permitirCrearAnomalias();

    const customZoom = new Zoom({ className: 'custom-zoom' });
    /* this.map.addControl(customZoom); */

    this.mapControlService.selectedInformeId$.subscribe((informeId) => {
      this.selectedInformeId = informeId;
      this.mostrarAnomalias();
    });
  }

  private addOverlayInfoAnomalia() {
    // Overlay para los detalles de cada anomalia
    const element = document.getElementById('popup');

    const popup = new Overlay({
      element,
      positioning: OverlayPositioning.BOTTOM_CENTER,
      stopEvent: false,
      offset: [0, -50],
    });
    this.map.addOverlay(popup);

    this.map.on('click', (event) => {
      const clickedCoord = event.coordinate;
      const feature = this.map.getFeaturesAtPixel(event.pixel);
      if (feature.length > 0) {
        popup.setPosition(undefined);
        popup.setPosition(clickedCoord);
      } else {
        popup.setPosition(undefined);
      }
    });
  }

  private addCursorOnHover() {
    this.map.on('pointermove', (event) => {
      if (this.map.hasFeatureAtPixel(event.pixel)) {
        let feature = this.map
          .getFeaturesAtPixel(event.pixel)
          .filter((item) => item.getProperties().properties !== undefined);
        feature = feature.filter((item) => item.getProperties().properties.informeId == this.selectedInformeId);
        if (feature.length > 0) {
          this.map.getViewport().style.cursor = 'pointer';
        } else {
          this.map.getViewport().style.cursor = 'inherit';
        }
      } else {
        this.map.getViewport().style.cursor = 'inherit';
      }
    });
  }

  private transform(extent) {
    return transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
  }

  addLocationAreas() {
    const styles = {
      LineString: new Style({
        stroke: new Stroke({
          color: '#dbdbdb',
          lineDash: [4],
          width: 2,
        }),
        fill: new Fill({
          color: 'rgba(0, 0, 255, 0)',
        }),
        text: new Text({
          font: '16px "Open Sans", "Arial Unicode MS", "sans-serif"',
          placement: 'line',
          fill: new Fill({
            color: 'white',
          }),
          text: '',
        }),
      }),
    };

    const styleFunction = (feature) => {
      if (feature !== undefined) {
        const style = styles[feature.getGeometry().getType()];
        // style.getText().setText(feature.get('globalCoords'));
        // para la demo
        style.getText().setText(feature.get('globalCoords')[1]);
        return style;
      }
    };

    this.plantaService.getLocationsArea(this.plantaId).subscribe((locAreas) => {
      this.locAreasVectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(this.locAreasToGeoJSON(locAreas)),
      });

      this.map.addLayer(
        new VectorLayer({
          source: this.locAreasVectorSource,
          visible: true,
          style: styleFunction,
          /* style: new Style({
            stroke: new Stroke({
              color: 'red',
            }),
          }), */
        })
      );
    });
  }

  private locAreasToGeoJSON(locAreas: LocationAreaInterface[]) {
    let listOfFeatures = [];
    locAreas.forEach((locArea) => {
      let coordsList = [];
      locArea.path.forEach((coords) => {
        coordsList.push(fromLonLat([coords.lng, coords.lat]));
      });
      // Al ser un poligono, la 1era y utlima coord deben ser iguales:
      coordsList.push(coordsList[0]);

      listOfFeatures.push({
        type: 'Feature',
        properties: {
          // para la demo
          globalCoords: locArea.globalCoords,
          // globalCoords: locArea.globalX,
          // globalCoords: this.getGlobalCoords(locArea),
        },
        geometry: {
          type: 'LineString',
          coordinates: coordsList,
        },
      });
    });
    const geojsonObject = {
      type: 'FeatureCollection',
      // crs: {
      //   type: 'name',
      //   properties: {
      //     name: 'EPSG:3857',
      //   },
      // },
      features: listOfFeatures,
    };

    return geojsonObject;
  }

  private getGlobalCoords(locArea: LocationAreaInterface): string {
    const locs = [...locArea.globalCoords, locArea.globalX, locArea.globalY];

    const globalCoord = locs.find((loc) => loc !== '');

    return globalCoord;
  }

  /* permitirCrearAnomalias() {
    const draw = new Draw({
      source: this.anomaliasVectorSource,
      type: GeometryType.CIRCLE,
      geometryFunction: createBox(),
    });

    this.map.addInteraction(draw);
    draw.on('drawend', (event) => {
      this.addAnomaliaToDb(event.feature);
    });
  }

  private addAnomaliaToDb(feature: Feature) {
    const geometry = feature.getGeometry() as SimpleGeometry;

    const anomalia = new Anomalia(
      0,
      ['', '', ''],
      0,
      0,
      0,
      0,
      null,
      0,
      geometry.getCoordinates()[0],
      geometry.getType(),
      this.plantaId,
      this.selectedInformeId
    );
    // Guardar en la base de datos
    this.anomaliaService.addAnomalia(anomalia);
  } */

  private getColorAnomalia(feature: Feature) {
    const tipo = parseInt(feature.getProperties().properties.tipo);

    return GLOBAL.colores_tipos[tipo];
  }

  private getStyleAnomaliasMapa(selected = false) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        return new Style({
          stroke: new Stroke({
            color: this.getColorAnomalia(feature),

            width: selected ? 6 : 4,
          }),
          fill: new Fill({
            color: 'rgba(0, 0, 255, 0)',
          }),
          text: new Text({
            font: '16px "Open Sans", "Arial Unicode MS", "sans-serif"',
            placement: 'line',
            fill: new Fill({
              color: 'white',
            }),
            text: '',
          }),
        });
      }
    };
  }

  mostrarAnomalias() {
    this.filterService.filteredElements$.subscribe((anomalias) => {
      // Dibujar anomalias
      this.dibujarAnomalias(anomalias as Anomalia[]);
      this.listaAnomalias = anomalias as Anomalia[];
    });
  }

  dibujarAnomalias(anomalias: Anomalia[]) {
    // Para cada vector layer (que corresponde a un informe)
    this.anomaliaLayers.forEach((l) => {
      // filtra las anomalías correspondientes al informe
      const filtered = anomalias.filter((item) => item.informeId == l.getProperties().informeId);
      const source = l.getSource();
      source.clear();
      filtered.forEach((anom) => {
        const feature = new Feature({
          geometry: new Polygon([anom.featureCoords]),
          properties: {
            anomaliaId: anom.id,
            tipo: anom.tipo,
            clase: anom.clase,
            temperaturaMax: anom.temperaturaMax,
            temperaturaRef: anom.temperaturaRef,
            informeId: anom.informeId,
          },
        });
        source.addFeature(feature);
      });
    });

    this._addSelectInteraction();
  }

  private _addSelectInteraction() {
    const select = new Select({
      style: this.getStyleAnomaliasMapa(true),
      condition: click,
      layers: (l) => {
        if (l.getProperties().informeId == this.selectedInformeId) {
          return true;
        }
        return false;
      },
    });
    this.map.addInteraction(select);
    select.on('select', (e) => {
      this.anomaliaSeleccionada = undefined;

      if (e.selected.length > 0) {
        if (e.selected[0].getProperties().hasOwnProperty('properties')) {
          const anomaliaId = e.selected[0].getProperties().properties.anomaliaId;

          const anomalia = this.listaAnomalias.filter((anom) => {
            return anom.id == anomaliaId;
          })[0];
          if (this.selectedInformeId == anomalia.informeId) {
            this.anomaliaSeleccionada = anomalia;
          }
        }
      }
    });
  }
}
