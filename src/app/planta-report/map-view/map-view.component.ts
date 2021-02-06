import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Map from 'ol/Map';
import XYZ from 'ol/source/XYZ';
import OSM from 'ol/source/OSM';
import XYZ_mod from '../xyz_mod.js';
import { fromLonLat, transformExtent } from 'ol/proj.js';
import View from 'ol/View';
import { PlantaService } from '../../core/services/planta.service';
import { PlantaInterface } from '../../core/models/planta';
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
import { defaults as defaultControls } from 'ol/control.js';
import OverlayPositioning from 'ol/OverlayPositioning';
import { GLOBAL } from '../../core/services/global';
import { InformeService } from '../../core/services/informe.service';
import { take } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { ThermalLayerInterface } from '../../core/models/thermalLayer';
import { ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { FilterService } from '../../core/services/filter.service';
import { getRenderPixel } from 'ol/render';
import { mouseOnly } from 'ol/events/condition';
import { click } from 'ol/events/condition';

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
  public selectedInformeId: string;
  public anomaliasVectorSource: VectorSource;
  public thermalSource;
  public anomaliaSeleccionada: Anomalia;
  public listaAnomalias: Anomalia[];
  public sliderYear: number;
  public aerialLayer: TileLayer;
  private extent1: any;
  private thermalLayers: TileLayer[];
  private anomaliaLayers: VectorLayer[];
  public leftOpened: boolean;
  public rightOpened: boolean;
  public statsOpened: boolean;
  public anomaliasLoaded = false;
  public mousePosition;
  public informesList: string[];

  @ViewChild('sidenavLeft') sidenavLeft: MatSidenav;
  @ViewChild('sidenavRight') sidenavRight: MatSidenav;
  @ViewChild('sidenavStats') sidenavStats: MatSidenav;

  constructor(
    private anomaliaService: AnomaliaService,
    public mapControlService: MapControlService,
    private route: ActivatedRoute,
    private plantaService: PlantaService,
    private informeService: InformeService,
    public filterService: FilterService
  ) {}

  ngOnInit(): void {
    this.mousePosition = null;
    this.informesList = ['4ruzdxY6zYxvUOucACQ0', 'vfMHFBPvNFnOFgfCgM9L'];
    this.selectedInformeId = this.informesList[1];
    // Para la demo, agregamos un extent a todas las capas:
    this.extent1 = this.transform([-7.0608, 38.523619, -7.056351, 38.522765]);

    this.plantaId = this.route.snapshot.paramMap.get('id');
    this.filterService.initFilterService(this.plantaId, 'planta').subscribe((v) => {
      this.anomaliasLoaded = v;
    });

    // Obtenemos todas las capas termicas para esta planta y las almacenamos en this.thermalLayers
    combineLatest([
      this.plantaService.getThermalLayers$(this.plantaId),
      this.informeService.getInformesDePlanta(this.plantaId),
      this.plantaService.getPlanta(this.plantaId),
    ])
      .pipe(take(1))
      .subscribe(([thermalLayers, informes, planta]) => {
        this.thermalLayers = Array<TileLayer>();
        this.anomaliaLayers = Array<VectorLayer>();
        // Para cada informe, hay que crear 2 capas: térmica y vectorial
        informes.forEach((informe) => {
          // Crear capa térmica
          const tl = thermalLayers.filter((item) => item.informeId == informe.id);

          //crear capa de las anomalias
          // const al = this.anomaliaLayers.push(al);
          // TODO: Comprobar que existe...
          if (tl.length > 0) {
            this.thermalLayers.push(this._createThermalLayer(tl[0], informe.id));
          }
          this.anomaliaLayers.push(this._createAnomaliaLayer(informe.id));

          // Crear capa vectorial
        });

        this.planta = planta;
        this.initMap();
      });

    this.mapControlService.selectedInformeId = this.informesList[1];
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
      informeId: informeId,
    });

    return tl;
  }
  private _createAnomaliaLayer(informeId: string): VectorLayer {
    const vl = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleAnomaliasMapa(false),
    });

    vl.setProperties({
      informeId: informeId,
    });

    return vl;
  }

  onChangeSlider(highValue: number, lowValue: number) {
    this.mapControlService.sliderMax = highValue;
    this.mapControlService.sliderMin = lowValue;
    // this.mapControlService.sliderMin = this.value;
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

    const layers = [osmLayer, this.aerialLayer].concat(this.thermalLayers);

    // Escuchar el postrender
    this.thermalLayers[1].on('postrender', (event) => {
      if (this.anomaliaSeleccionada) {
        const coords = this.anomaliaSeleccionada.featureCoords;
        var pixel = getRenderPixel(event, coords[0]);

        var context = event.context;
        var centerX = coords[0][0];
        var centerY = coords[0][1];
        const sx = this._distance(coords[0], coords[1]);
        const sy = this._distance(coords[2], coords[1]);
        const tiles = event.target.renderer_.layer_.renderer_.renderedTiles;

        const canvas = event.context.canvas;
        // tiles.forEach((tile) => {
        //   if (tile.lastCanvas == canvas) {
        //     console.log('tile', tile);
        //   }
        // });

        // var sourceData = context.getImageData(centerX, centerY, sx, sy).data;
        // const;
      }
    });

    // get the pixel position with every move
    // var container = document.getElementById('map');
    // container.addEventListener('mousemove', (event) => {
    //   this.mousePosition = this.map.getEventPixel(event);
    //   this.map.render();
    // });

    // container.addEventListener('mouseout', () => {
    //   this.mousePosition = null;
    //   this.map.render();
    // });
    // const radius = 75;

    // // after rendering the layer, show an oversampled version around the pointer
    // this.thermalLayers[1].on('postrender', (event) => {
    //   if (this.mousePosition) {
    //     var pixel = getRenderPixel(event, this.mousePosition);
    //     var offset = getRenderPixel(event, [this.mousePosition[0] + radius, this.mousePosition[1]]);
    //     var half = Math.sqrt(Math.pow(offset[0] - pixel[0], 2) + Math.pow(offset[1] - pixel[1], 2));
    //     var context = event.context;
    //     var centerX = pixel[0];
    //     var centerY = pixel[1];
    //     var originX = centerX - half;
    //     var originY = centerY - half;
    //     var size = Math.round(2 * half + 1);
    //     var sourceData = context.getImageData(originX, originY, size, size).data;
    //     var dest = context.createImageData(size, size);
    //     var destData = dest.data;
    //     for (var j = 0; j < size; ++j) {
    //       for (var i = 0; i < size; ++i) {
    //         var dI = i - half;
    //         var dJ = j - half;
    //         var dist = Math.sqrt(dI * dI + dJ * dJ);
    //         var sourceI = i;
    //         var sourceJ = j;
    //         if (dist < half) {
    //           sourceI = Math.round(half + dI / 2);
    //           sourceJ = Math.round(half + dJ / 2);
    //         }
    //         var destOffset = (j * size + i) * 4;
    //         var sourceOffset = (sourceJ * size + sourceI) * 4;
    //         destData[destOffset] = sourceData[sourceOffset];
    //         destData[destOffset + 1] = sourceData[sourceOffset + 1];
    //         destData[destOffset + 2] = sourceData[sourceOffset + 2];
    //         destData[destOffset + 3] = sourceData[sourceOffset + 3];
    //       }
    //     }
    //     context.beginPath();
    //     context.arc(centerX, centerY, half, 0, 2 * Math.PI);
    //     context.lineWidth = (3 * half) / radius;
    //     context.strokeStyle = 'rgba(255,255,255,0.5)';
    //     context.putImageData(dest, originX, originY);
    //     context.stroke();
    //     context.restore();
    //   }
    // });

    // MAPA
    this.map = new Map({
      target: 'map',
      controls: defaultControls({ attribution: false }),

      layers: layers,
      view: new View({
        center: fromLonLat([this.planta.longitud, this.planta.latitud]),
        zoom: 18,
        maxZoom: 24,
        extent: this.transform([-7.060903, 38.523993, -7.0556, 38.522264]),
      }),
    });
    this.anomaliaLayers.forEach((l) => this.map.addLayer(l));
    this.addCursorOnHover();
    this.addLocationAreas();
    this.addOverlayInfoAnomalia();
    // this.permitirCrearAnomalias();

    // Slider para la capa termica
    this.mapControlService.sliderMaxSource.subscribe((v) => {
      this.thermalLayers.forEach((tl) => {
        tl.getSource().changed();
      });
    });
    this.mapControlService.sliderMinSource.subscribe((v) => {
      this.thermalLayers.forEach((tl) => {
        tl.getSource().changed();
      });
    });
    this.mapControlService.sliderThermalOpacitySource.subscribe((v) => {
      this.thermalLayers.forEach((layer) => {
        // TODO
        // const val = v/100;

        // const dif = layer.getOpacity()-v/100
        layer.setOpacity(v / 100);
      });
    });
    this.mapControlService.sliderTemporalSource.subscribe((v) => {
      this.thermalLayers[1].setOpacity(v / 100); // 2020
      this.anomaliaLayers[1].setOpacity(v / 100);
      this.anomaliaLayers[0].setOpacity(1 - v / 100);
      this.thermalLayers[0].setOpacity(1 - v / 100); // 2019
      // this.thermalLayers.forEach(layer => {
      //   layer.setOpacity(v / 100);
      // })
      if (v >= 50) {
        this.selectedInformeId = this.informesList[1];
      } else {
        this.selectedInformeId = this.informesList[0];
      }
    });
    this.mapControlService.selectedInformeId$.subscribe((informeId) => {
      this.selectedInformeId = informeId;
      this.mostrarTodasAnomalias(this.selectedInformeId);
    });
  }
  private addOverlayInfoAnomalia() {
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

  private _distance(x, y) {
    return Math.sqrt(Math.pow(x[0] - y[0], 2) + Math.pow(x[1] - y[1], 2));
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
      this.selectedInformeId
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
      if (feature != undefined && feature.getProperties().hasOwnProperty('properties')) {
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
    this.filterService.filteredElements$.subscribe((anomalias) => {
      // Dibujar anomalias
      this.dibujarAnomalias(anomalias as Anomalia[]);
      this.listaAnomalias = anomalias as Anomalia[];
    });
  }
  dibujarAnomalias(anomalias: Anomalia[]) {
    // Para cada vector layer (que corresponde a un informe)

    this.anomaliaLayers.forEach((l) => {
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
        // feature.setProperties({
        //   anomaliaId: anom.id,
        //   tipo: anom.tipo,
        //   clase: anom.clase,
        //   temperaturaMax: anom.temperaturaMax,
        //   temperaturaRef: anom.temperaturaRef,
        //   informeId: anom.informeId,
        // });
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
