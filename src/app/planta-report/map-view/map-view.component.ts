import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Map from 'ol/Map';
import XYZ from 'ol/source/XYZ';
import OSM from 'ol/source/OSM';
import XYZ_mod from '../xyz_mod.js';
import { fromLonLat } from 'ol/proj';
import View from 'ol/View';
import { PlantaService } from '../../core/services/planta.service';
import { PlantaInterface } from '../../core/models/planta';
import { transformExtent } from 'ol/proj';

import ImageTileMod from '../ImageTileMod.js';
import { MapControlService } from '../services/map-control.service';
import { LocationAreaInterface } from '../../core/models/location';
import GeoJSON from 'ol/format/GeoJSON';
import { Fill, Stroke, Style, Text } from 'ol/style';
import Draw, { createBox } from 'ol/interaction/Draw';
import Select from 'ol/interaction/Select';
import { Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import GeometryType from 'ol/geom/GeometryType';
import { Anomalia } from '@core/models/anomalia.js';
import SimpleGeometry from 'ol/geom/SimpleGeometry';
import { AnomaliaService } from '../../core/services/anomalia.service';
import { Feature, Overlay } from 'ol';
import Polygon from 'ol/geom/Polygon';
import { take } from 'rxjs/operators';

import OverlayPositioning from 'ol/OverlayPositioning';
import { Options } from '@angular-slider/ngx-slider';

// planta prueba: egF0cbpXnnBnjcrusoeR
@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css'],
})
export class MapViewComponent implements OnInit {
  public plantaId: string;
  public planta: PlantaInterface;
  public map: Map;
  public rangeMin: number;
  public rangeMax: number;
  public palleteJSON: string;
  public activeInformeId: string;
  public anomaliasVectorSource: VectorSource;
  public thermalSource;

  constructor(
    private anomaliaService: AnomaliaService,
    public mapControlService: MapControlService,
    private route: ActivatedRoute,
    private plantaService: PlantaService
  ) {}

  ngOnInit(): void {
    this.plantaId = this.route.snapshot.paramMap.get('id');
    this.activeInformeId = 'AAA';

    this.plantaService.getPlanta(this.plantaId).subscribe((planta) => {
      this.planta = planta;
      this.anomaliasVectorSource = new VectorSource({ wrapX: false });
      this.initMap();
      this.permitirCrearAnomalias();
    });
  }
  onChangeSlider(highValue: number, lowValue: number) {
    this.mapControlService.sliderMax = highValue;
    this.mapControlService.sliderMin = lowValue;
    // this.mapControlService.sliderMin = this.value;
  }
  initMap() {
    const satellite = new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    });
    const aerial = new XYZ({
      url: 'https://solardrontech.es/demo_rgb/{z}/{x}/{y}.png',
    });

    // Iniciar mapa térmico
    this.thermalSource = new XYZ_mod({
      url: 'http://solardrontech.es/tileserver.php?/index.json?/demo_thermal/{z}/{x}/{y}.png',
      crossOrigin: '',
      tileClass: ImageTileMod,
      transition: 255,
      tileLoadFunction: (imageTile, src) => {
        imageTile.mapControlService = this.mapControlService;
        imageTile.getImage().src = src;
      },
    });
    const extent1 = this.transform([-7.0608, 38.523619, -7.056351, 38.522765]);

    let thermalLayer = new TileLayer({
      source: this.thermalSource,
      extent: extent1,
    });

    // MAPA
    this.map = new Map({
      target: 'map',

      layers: [
        new TileLayer({
          // source: satellite,
          source: new OSM(),
          // extent: extent1,
        }),
        new TileLayer({
          source: aerial,
          extent: extent1,
        }),
        thermalLayer,
        // }),
      ],
      view: new View({
        center: fromLonLat([this.planta.longitud, this.planta.latitud]),
        zoom: 18,
        maxZoom: 25,
        extent: this.transform([-7.060903, 38.523993, -7.0556, 38.522264]),
      }),
    });

    this.mapControlService.sliderMaxSource.subscribe((v) => {
      this.thermalSource.changed();
    });
    this.mapControlService.sliderMinSource.subscribe((v) => {
      this.thermalSource.changed();
    });

    this.addLocationAreas();
    this.mostrarTodasAnomalias(this.activeInformeId);
    const vectorDrawingLayer = new VectorLayer({
      source: this.anomaliasVectorSource,
    });
    this.map.addLayer(vectorDrawingLayer);

    this.addOverlayInfoAnomalia();
  }
  addOverlayInfoAnomalia() {
    //Overlay para los detalles de cada anomalia
    const element = document.getElementById('popup');

    var popup = new Overlay({
      element: element,
      positioning: OverlayPositioning.BOTTOM_CENTER,
      stopEvent: false,
      offset: [0, -50],
    });
    this.map.addOverlay(popup);

    this.map.on('click', (event) => {
      const clickedCoord = event.coordinate;
      var feature = this.map.getFeaturesAtPixel(event.pixel);
      if (feature.length > 0) {
        const geometry = feature[0].getGeometry() as Polygon;
        var coordinate = geometry.getCoordinates();
        popup.setPosition(undefined);
        popup.setPosition(clickedCoord);
        element.innerHTML = 'hola probando';

        // $(element).popover('show');
      } else {
        popup.setPosition(undefined);
      }
    });
  }

  addCursorOnHover() {
    this.map.on('pointermove', (event) => {
      if (this.map.hasFeatureAtPixel(event.pixel)) {
        this.map.getViewport().style.cursor = 'pointer';
      } else {
        this.map.getViewport().style.cursor = 'inherit';
      }
    });
  }

  transform(extent) {
    return transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
  }
  addLocationAreas() {
    this.plantaService.getLocationsArea(this.plantaId).subscribe((locAreas) => {
      const geojsonObject = this.locAreasToGeoJSON(locAreas);

      var vectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(geojsonObject),
      });

      var styles = {
        LineString: new Style({
          stroke: new Stroke({
            color: 'blue',
            lineDash: [4],
            width: 3,
          }),
          fill: new Fill({
            color: 'rgba(0, 0, 255, 0.1)',
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
      var styleFunction = (feature) => {
        if (feature != undefined) {
          let style = styles[feature.getGeometry().getType()];
          // style.getText().setText(feature.get('globalCoords'));
          style.getText().setText(feature.get('globalCoords')[1]);
          return style;
        }
      };

      var vectorLayer = new VectorLayer({
        source: vectorSource,
        visible: true,
        style: styleFunction,

        // style: styleFunction,
      });

      this.map.addLayer(vectorLayer);
    });
  }
  locAreasToGeoJSON(locAreas: LocationAreaInterface[]) {
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
          globalCoords: locArea.globalCoords,
        },
        geometry: {
          type: 'LineString',
          coordinates: [coordsList],
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
  permitirCrearAnomalias() {
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
  addAnomaliaToDb(feature: Feature) {
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
      this.activeInformeId
    );
    // Guardar en la base de datos
    this.anomaliaService.addAnomalia(anomalia);
  }
  mostrarTodasAnomalias(informeId: string) {
    this.anomaliaService
      .getAnomalias(this.plantaId, informeId)
      .pipe(take(5))
      .subscribe((anomalias) => {
        // Dibujar anomalias
        this.dibujarAnomalias(anomalias);
      });
  }
  dibujarAnomalias(anomalias: Anomalia[]) {
    this.anomaliasVectorSource.clear();
    anomalias.forEach((anom) => {
      const feature = this.anomaliasVectorSource.addFeature(
        new Feature({
          geometry: new Polygon([anom.featureCoords]),
          properties: {
            tipo: anom.tipo,
            clase: anom.clase,
            temperaturaMax: anom.temperaturaMax,
            temperaturaRef: anom.temperaturaRef,
          },
        })
      );
    });
    this.addSelectInteraction();
  }
  addSelectInteraction() {
    const select = new Select({
      // condition: 'pointermove'
    });
    this.map.addInteraction(select);
    select.on('select', function (e) {
      console.log('🚀 ~ file: map-view.component.ts ~ line 285 ~ e', e);
      //   document.getElementById('status').innerHTML =
      //     '&nbsp;' +
      //     e.target.getFeatures().getLength() +
      //     ' selected features (last operation selected ' +
      //     e.selected.length +
      //     ' and deselected ' +
      //     e.deselected.length +
      //     ' features)';
      // });
    });
  }
}
