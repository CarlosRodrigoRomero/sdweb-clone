import { Component, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import { fromLonLat, transformExtent } from 'ol/proj.js';
import View from 'ol/View';
import GeoJSON from 'ol/format/GeoJSON';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { Overlay } from 'ol';
import { defaults as defaultControls } from 'ol/control.js';
import OverlayPositioning from 'ol/OverlayPositioning';
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
import { AnomaliasControlService } from '../../services/anomalias-control.service';
import { ReportControlService } from '@core/services/report-control.service';

import { PlantaInterface } from '@core/models/planta';
import { LocationAreaInterface } from '@core/models/location';
import { Anomalia } from '@core/models/anomalia';
import { ThermalLayerInterface } from '@core/models/thermalLayer';

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
  public anomaliaSelect: Anomalia;
  public anomaliaHover: Anomalia;
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
  public informeIdList: string[] = [];
  public sharedReport = false;

  constructor(
    public mapControlService: MapControlService,
    private plantaService: PlantaService,
    private informeService: InformeService,
    public filterService: FilterService,
    private olMapService: OlMapService,
    private shareReportService: ShareReportService,
    private anomaliasControlService: AnomaliasControlService,
    private reportControlService: ReportControlService
  ) {}

  ngOnInit(): void {
    this.mousePosition = null;

    // Para la demo, agregamos un extent a todas las capas:
    this.extent1 = this.transform([-7.0608, 38.523619, -7.056351, 38.522765]);

    // this.plantaId = 'egF0cbpXnnBnjcrusoeR';
    this.reportControlService.plantaId$.subscribe((plantaId) => {
      this.plantaId = plantaId;

      // Obtenemos todas las capas para esta planta
      combineLatest([
        this.plantaService.getThermalLayers$(this.plantaId),
        this.informeService.getInformesDePlanta(this.plantaId),
        this.plantaService.getPlanta(this.plantaId),
      ])
        .pipe(take(1))
        .subscribe(([thermalLayers, informes, planta]) => {
          // nos suscribimos a las capas termica y de anomalias
          this.olMapService.getThermalLayers().subscribe((layers) => (this.thermalLayers = layers));
          this.olMapService.getAnomaliaLayers().subscribe((layers) => (this.anomaliaLayers = layers));

          this.informeIdList = informes.sort((a, b) => a.fecha - b.fecha).map((informe) => informe.id);

          console.log(this.informeIdList[1]);

          // Para cada informe, hay que crear 2 capas: térmica y vectorial
          informes
            .sort((a, b) => a.fecha - b.fecha)
            .forEach((informe) => {
              const tl = thermalLayers.find((item) => item.informeId === informe.id);

              // TODO: Comprobar que existe...
              if (tl !== undefined) {
                this.olMapService.addThermalLayer(this._createThermalLayer(tl, informe.id));
              }
              // this.informeIdList.push(informe.id);

              // creamos las capas de anomalías para los diferentes informes
              this.olMapService.addAnomaliaLayer(this._createAnomaliaLayer(informe.id));
            });

          this.planta = planta;

          // seleccionamos el informe mas reciente de la planta
          this.reportControlService.selectedInformeId$.subscribe((informeId) => {
            this.selectedInformeId = informeId;
          });
          // this.selectedInformeId = this.informeIdList[this.informeIdList.length - 1];

          // asignamos los IDs necesarios para compartir
          this.shareReportService.setPlantaId(this.plantaId);

          // this.mapControlService.selectedInformeId = this.informeIdList[this.informeIdList.length - 1];

          this.initMap();
        });
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
      style: this.anomaliasControlService.getStyleAnomaliasMapa(false),
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

    this.olMapService.createMap('map', layers, view, defaultControls({ attribution: false })).subscribe((map) => {
      this.map = map;
    });

    this.anomaliaLayers.forEach((l) => this.map.addLayer(l));

    // inicializamos el servicio que controla el comportamiento de las anomalias
    this.anomaliasControlService.initService().subscribe(() => {
      this.anomaliasControlService.mostrarAnomalias();
      this.anomaliasControlService.anomaliaHover$.subscribe((anomalia) => (this.anomaliaHover = anomalia));
      this.anomaliasControlService.anomaliaSelect$.subscribe((anomalia) => (this.anomaliaSelect = anomalia));
    });

    // this.addOverlayInfoAnomalia();

    // añadimos areas globals
    if (!this.sharedReport) {
      this.addLocationAreas();
    }

    // this.reportControlService.selectedInformeId$.subscribe((informeId) => {
    //   this.selectedInformeId = informeId;
    // });
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

  private transform(extent) {
    return transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
  }

  private addLocationAreas() {
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
}
