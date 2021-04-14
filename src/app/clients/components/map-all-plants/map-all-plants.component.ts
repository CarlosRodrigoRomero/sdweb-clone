import { Component, ElementRef, Input, OnInit } from '@angular/core';
import 'ol/ol.css';
import Circle from 'ol/geom/Circle';

import { defaults as defaultControls } from 'ol/control.js';

import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import { Fill, Stroke, Style } from 'ol/style';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { switchMap } from 'rxjs/operators';
import { fromLonLat } from 'ol/proj';
import { PlantaInterface } from '@core/models/planta';
import { AuthService } from '@core/services/auth.service';
import { PlantaService } from '@core/services/planta.service';
import { GLOBAL } from '@core/services/global';
import { PortfolioControlService } from '@core/services/portfolio-control.service';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-map-all-plants',
  templateUrl: './map-all-plants.component.html',
  styleUrls: ['./map-all-plants.component.css'],
})
export class MapAllPlantsComponent implements OnInit {
  plantas: PlantaInterface[];
  defaultLng = -4;
  defaultLat = 40;
  defalutZoom = 6;
  geojsonObject: any;
  map: Map;
  public plantaHover: PlantaInterface;
  private prevFeatureHover: any;

  constructor(
    private plantaService: PlantaService,
    public auth: AuthService,
    private elementRef: ElementRef,
    private portfolioControlService: PortfolioControlService
  ) {}

  ngOnInit(): void {
    this.auth.user$
      .pipe(
        switchMap((user) => {
          return this.plantaService.getPlantasDeEmpresa(user);
        })
      )
      .subscribe((plantas) => {
        this.plantas = plantas;
        this.initMap();
        const vectorSource = new VectorSource({});
        const style = new Style({
          stroke: new Stroke({
            width: 2,
          }),
          fill: new Fill({}),
        });

        plantas.forEach((planta) => {
          const feature = new Feature(new Circle(fromLonLat([planta.longitud, planta.latitud]), 1e4));

          if (planta.informes !== undefined && planta.informes.length > 0) {
            const mae = planta.informes.reduce((prev, current) => (prev.fecha > current.fecha ? prev : current)).mae;

            if (mae !== undefined) {
              feature.setProperties({
                mae,
              });

              style.getStroke().setColor(this.portfolioControlService.getColorMae(mae));
              style.getFill().setColor(this.portfolioControlService.getColorMae(mae, 0.3));
            }
          }

          vectorSource.addFeature(feature);
        });
        const vectorLayer = new VectorLayer({
          source: vectorSource,
          style,
        });
        this.map.addLayer(vectorLayer);
      });
  }

  initMap() {
    this.map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([this.defaultLng, this.defaultLat]),
        zoom: this.defalutZoom,
      }),
      controls: defaultControls({ attribution: false, zoom: false }).extend([]),
    });

    this.addPointerOnHover();
    this.addOnHoverAction();

    // this.portfolioControlService.plantaHover$.subscribe((planta) => (this.plantaHover = planta));
  }

  private addPointerOnHover() {
    this.map.on('pointermove', (event) => {
      if (this.map.hasFeatureAtPixel(event.pixel)) {
        const feature = this.map.getFeaturesAtPixel(event.pixel);

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
    let currentFeatureHover;
    this.map.on('pointermove', (event) => {
      if (this.map.hasFeatureAtPixel(event.pixel)) {
        const feature = this.map.getFeaturesAtPixel(event.pixel);

        if (feature.length > 0) {
          // cuando pasamos de una anomalia a otra directamente sin pasar por vacio
          if (this.prevFeatureHover !== undefined && this.prevFeatureHover !== feature) {
            (this.prevFeatureHover[0] as Feature).setStyle(this.getStyleOnHover(false));
          }
          currentFeatureHover = feature;

          (feature[0] as Feature).setStyle(this.getStyleOnHover(true));

          this.prevFeatureHover = feature;
        }
      } else {
        this.plantaHover = undefined;

        if (currentFeatureHover !== undefined) {
          (currentFeatureHover[0] as Feature).setStyle(this.getStyleOnHover(false));
        }
      }
    });
  }

  private getStyleOnHover(hovered: boolean) {
    if (hovered) {
      return (feature: Feature) => {
        if (feature !== undefined) {
          return new Style({
            stroke: new Stroke({
              color: 'white',
              width: 6,
            }),
            fill: new Fill({
              color: this.portfolioControlService.getColorMae(feature.getProperties().mae, 0.3),
            }),
          });
        }
      };
    } else {
      return (feature: Feature) => {
        if (feature !== undefined) {
          return new Style({
            stroke: new Stroke({
              color: this.portfolioControlService.getColorMae(feature.getProperties().mae),
              width: 2,
            }),
            fill: new Fill({
              color: this.portfolioControlService.getColorMae(feature.getProperties().mae, 0.3),
            }),
          });
        }
      };
    }
  }
}
