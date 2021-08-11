import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { MatSnackBar } from '@angular/material/snack-bar';

import 'ol/ol.css';
import Circle from 'ol/geom/Circle';
import { defaults as defaultControls } from 'ol/control.js';
import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import { Fill, Stroke, Style } from 'ol/style';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { fromLonLat } from 'ol/proj';

import { PortfolioControlService } from '@core/services/portfolio-control.service';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';

@Component({
  selector: 'app-map-all-plants',
  templateUrl: './map-all-plants.component.html',
  styleUrls: ['./map-all-plants.component.css'],
})
export class MapAllPlantsComponent implements OnInit {
  private plantas: PlantaInterface[];
  private informes: InformeInterface[];
  private plantasAñadidasId: string[] = [];
  defaultLng = -4;
  defaultLat = 40;
  defalutZoom = 5.5;
  geojsonObject: any;
  map: Map;
  public plantaHover: PlantaInterface;
  private prevFeatureHover: any;

  constructor(
    private portfolioControlService: PortfolioControlService,
    private router: Router,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.plantas = this.portfolioControlService.listaPlantas;
    this.informes = this.portfolioControlService.listaInformes;

    this.initMap();

    const vectorSource = new VectorSource({});

    this.plantas.forEach((planta) => {
      const feature = new Feature(new Circle(fromLonLat([planta.longitud, planta.latitud]), 1e4));

      if (planta.informes !== undefined && planta.informes.length > 0) {
        // añadimos los ya añadidos

        const informeReciente = planta.informes.reduce((prev, current) =>
          prev.fecha > current.fecha ? prev : current
        );

        if (informeReciente.mae !== undefined) {
          // añadimos la planta a añadidas

          feature.setProperties({
            mae: informeReciente.mae,
            plantaId: planta.id,
            tipo: planta.tipo,
            fechaInfReciente: informeReciente.fecha,
          });
        }
        // buscamos tambien informes que no esten dentro de la interfaz planta
      } else if (this.informes.map((inf) => inf.plantaId).includes(planta.id)) {
        const informesAdiccionales = this.informes.filter((inf) => inf.plantaId === planta.id);
        const informeReciente = informesAdiccionales.reduce((prev, current) =>
          prev.fecha > current.fecha ? prev : current
        );

        if (informeReciente.mae !== undefined) {
          feature.setProperties({
            mae: informeReciente.mae,
            plantaId: planta.id,
            tipo: planta.tipo,
            fechaInfReciente: informeReciente.fecha,
          });
        }
      }
      this.portfolioControlService.allFeatures.push(feature);

      vectorSource.addFeature(feature);
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: this.getStyleOnHover(false),
    });
    this.map.addLayer(vectorLayer);
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
    this.addOnClickAction();
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

  private addOnClickAction() {
    this.map.on('click', (event) => {
      const feature = this.map.getFeaturesAtPixel(event.pixel);

      if (feature.length > 0) {
        const plantaId = feature[0].getProperties().plantaId;
        const tipoPlanta = feature[0].getProperties().tipo;
        const fechaInformeReciente = feature[0].getProperties().fechaInfReciente;

        if (tipoPlanta === 'seguidores') {
          this.router.navigate(['clients/tracker/' + plantaId]);
        } else if (fechaInformeReciente > 1619820000 || plantaId === 'egF0cbpXnnBnjcrusoeR') {
          this.router.navigate(['clients/fixed/' + plantaId]);
        } else {
          this.openSnackBar();
        }
      }
    });
  }

  private openSnackBar() {
    this._snackBar.open('Planta en mantenimiento temporalmente', 'OK', {
      duration: 5000,
      verticalPosition: 'top',
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
