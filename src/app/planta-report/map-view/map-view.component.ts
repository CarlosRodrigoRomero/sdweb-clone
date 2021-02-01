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
import { Anomalia } from '@core/models/anomalia';
import SimpleGeometry from 'ol/geom/SimpleGeometry';
import { AnomaliaService } from '../../core/services/anomalia.service';
import { Feature, Overlay } from 'ol';
import Polygon from 'ol/geom/Polygon';

import OverlayPositioning from 'ol/OverlayPositioning';
import { GLOBAL } from '../../core/services/global';

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
  public anomaliaSeleccionada: Anomalia;
  public listaAnomalias: Anomalia[];

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
      this.initMap();
      // this.permitirCrearAnomalias();
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
        maxZoom: 24,
        extent: this.transform([-7.060903, 38.523993, -7.0556, 38.522264]),
      }),
    });
    this.addCursorOnHover();
    this.addLocationAreas();
    this.addOverlayInfoAnomalia();

    // Slider para la capa termica
    this.mapControlService.sliderMaxSource.subscribe((v) => {
      this.thermalSource.changed();
    });
    this.mapControlService.sliderMinSource.subscribe((v) => {
      this.thermalSource.changed();
    });

    this.mostrarTodasAnomalias(this.activeInformeId);

    this.map.on('pointermove', (e) => {
      console.log('event', e);
    });
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
        // element.innerHTML = 'hola probando';

        // $(element).popover('show');
      } else {
        popup.setPosition(undefined);
      }
    });
  }

  private addCursorOnHover() {
    this.map.on('pointermove', (event) => {
      if (this.map.hasFeatureAtPixel(event.pixel)) {
        this.map.getViewport().style.cursor = 'pointer';
      } else {
        this.map.getViewport().style.cursor = 'inherit';
      }
    });
  }

  private transform(extent) {
    return transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
  }
  addLocationAreas() {
    this.plantaService.getLocationsArea(this.plantaId).subscribe((locAreas) => {
      console.log(
        '🚀 ~ file: map-view.component.ts ~ line 180 ~ this.plantaService.getLocationsArea ~ locAreas',
        locAreas
      );
      const geojsonObject = this.locAreasToGeoJSON(locAreas);
      console.log(
        '🚀 ~ file: map-view.component.ts ~ line 187 ~ this.plantaService.getLocationsArea ~ geojsonObject',
        geojsonObject
      );

      var vectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(geojsonObject),
      });

      var styles = {
        LineString: new Style({
          stroke: new Stroke({
            color: 'blue',
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
        if (feature != undefined) {
          let style = styles[feature.getGeometry().getType()];
          // style.getText().setText(feature.get('globalCoords'));
          style.getText().setText(feature.get('globalCoords')[1]);
          return style;
        }
      };

      this.map.addLayer(
        new VectorLayer({
          source: vectorSource,
          visible: true,
          style: styleFunction,
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
          globalCoords: locArea.globalCoords,
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
      this.activeInformeId
    );
    // Guardar en la base de datos
    this.anomaliaService.addAnomalia(anomalia);
  }

  private getColorAnomalia(feature: Feature) {
    const tipo = parseInt(feature.getProperties().properties.tipo);

    return GLOBAL.colores_tipos[tipo];
  }
  private getStyleAnomaliasMapa(selected = false) {
    return (feature) => {
      if (feature != undefined) {
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
  mostrarTodasAnomalias(informeId: string) {
    this.anomaliasVectorSource = new VectorSource({ wrapX: false });

    this.map.addLayer(
      new VectorLayer({
        source: this.anomaliasVectorSource,
        style: this.getStyleAnomaliasMapa(false),
      })
    );
    this.anomaliaService.getAnomalias$(this.plantaId, informeId).subscribe((anomalias) => {
      // Dibujar anomalias
      this.dibujarAnomalias(anomalias);
      this.listaAnomalias = anomalias;
    });
  }
  dibujarAnomalias(anomalias: Anomalia[]) {
    this.anomaliasVectorSource.clear();
    anomalias.forEach((anom) => {
      this.anomaliasVectorSource.addFeature(
        new Feature({
          geometry: new Polygon([anom.featureCoords]),
          properties: {
            anomaliaId: anom.id,
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
      style: this.getStyleAnomaliasMapa(true),
      // condition: 'pointermove'
    });
    this.map.addInteraction(select);
    select.on('select', (e) => {
      console.log('🚀 ~ file: map-view.component.ts ~ line 331 ~ select.on ~ e', e);
      if (e.selected.length > 0) {
        const anomaliaId = e.selected[0].getProperties().properties.anomaliaId;
        const anomalia = this.listaAnomalias.filter((anom) => {
          return anom.id == anomaliaId;
        })[0];
        this.anomaliaSeleccionada = anomalia;
        //   document.getElementById('status').innerHTML =
        //     '&nbsp;' +
        //     e.target.getFeatures().getLength() +
        //     ' selected features (last operation selected ' +
        //     e.selected.length +
        //     ' and deselected ' +
        //     e.deselected.length +
        //     ' features)';
        // });
      } else {
        this.anomaliaSeleccionada = undefined;
      }
    });
  }
}
