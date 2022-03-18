import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { MatSnackBar } from '@angular/material/snack-bar';

import { Subscription } from 'rxjs';

import 'ol/ol.css';
import Circle from 'ol/geom/Circle';
import { defaults as defaultControls } from 'ol/control.js';
import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import { Fill, Icon, Stroke, Style } from 'ol/style';
import { OSM, Vector as VectorSource, XYZ } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { fromLonLat } from 'ol/proj';
import { Overlay } from 'ol';
import Point from 'ol/geom/Point';

import { PortfolioControlService } from '@core/services/portfolio-control.service';
import { GLOBAL } from '@core/services/global';
import { OlMapService } from '@core/services/ol-map.service';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';

@Component({
  selector: 'app-map-all-plants',
  templateUrl: './map-all-plants.component.html',
  styleUrls: ['./map-all-plants.component.css'],
})
export class MapAllPlantsComponent implements OnInit, OnDestroy {
  private plantas: PlantaInterface[];
  private informes: InformeInterface[];
  private plantasAñadidasId: string[] = [];
  defaultLng = -4;
  defaultLat = 40;
  defaultZoom = 5.5;
  geojsonObject: any;
  map: Map;
  plantaHovered: PlantaInterface;
  private prevFeatureHover: any;
  private popup: Overlay;
  labelPlanta: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private portfolioControlService: PortfolioControlService,
    private router: Router,
    private _snackBar: MatSnackBar,
    private olMapService: OlMapService
  ) {}

  ngOnInit(): void {
    this.plantas = this.portfolioControlService.listaPlantas;
    this.informes = this.portfolioControlService.listaInformes;

    this.subscriptions.add(
      this.portfolioControlService.plantaHovered$.subscribe((planta) => {
        this.plantaHovered = planta;
        if (planta !== undefined) {
          this.labelPlanta = planta.nombre + '  (' + planta.potencia + ' MW)';

          this.map.getOverlayById('popup').setPosition(fromLonLat([planta.longitud, planta.latitud]));
        }
      })
    );

    this.initMap();

    this.addFeaturesLayer();

    this.addPopupOverlay();

    this.addPointerOnHover();
    this.addOnHoverAction();
    this.addOnClickAction();
  }

  initMap() {
    const source = new XYZ({
      url: 'http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}', // hidrido
      // url: 'http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}', // satelite
      crossOrigin: '',
    });
    const layer = new TileLayer({
      source,
    });
    const view = new View({
      center: fromLonLat([this.defaultLng, this.defaultLat]),
      zoom: this.defaultZoom,
    });
    const controls = defaultControls({ attribution: false, zoom: false });

    // creamos el mapa a traves del servicio y nos subscribimos a el
    this.subscriptions.add(
      this.olMapService.createMap('map', [layer], view, controls).subscribe((map) => (this.map = map))
    );
  }

  private addFeaturesLayer() {
    const vectorSource = new VectorSource({});

    this.plantas.forEach((planta) => {
      const informesPlanta = this.informes.filter((informe) => informe.plantaId === planta.id);
      const informeReciente = informesPlanta.reduce((prev, current) => (prev.fecha > current.fecha ? prev : current));

      const feature = new Feature({
        geometry: new Point(fromLonLat([planta.longitud, planta.latitud])),
      });

      feature.setProperties({
        planta,
        informeReciente,
      });

      feature.setStyle(
        new Style({
          image: new Icon({
            color: this.portfolioControlService.getColorMae(feature.getProperties().informeReciente.mae),
            crossOrigin: 'anonymous',
            src: 'assets/icons/place_black_24dp.svg',
            scale: 0.8,
          }),
        })
      );

      this.portfolioControlService.allFeatures.push(feature);

      vectorSource.addFeature(feature);
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: this.getStyleOnHover(false),
    });

    this.map.addLayer(vectorLayer);
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
        const features = this.map.getFeaturesAtPixel(event.pixel) as Feature[];

        if (features.length > 0) {
          const feature = features[0] as Feature;
          const planta = feature.getProperties().planta;

          // cuando pasamos de una anomalia a otra directamente sin pasar por vacio
          if (this.prevFeatureHover !== undefined && this.prevFeatureHover !== features) {
            (this.prevFeatureHover[0] as Feature).setStyle(this.getStyleOnHover(false));
          }
          currentFeatureHover = feature;

          feature.setStyle(this.getStyleOnHover(true));

          this.portfolioControlService.plantaHovered = planta;

          this.prevFeatureHover = feature;
        }
      } else {
        this.portfolioControlService.plantaHovered = undefined;

        this.map.getOverlayById('popup').setPosition(undefined);

        if (currentFeatureHover !== undefined) {
          currentFeatureHover.setStyle(this.getStyleOnHover(false));
        }
      }
    });
  }

  private addOnClickAction() {
    this.map.on('click', (event) => {
      const features = this.map.getFeaturesAtPixel(event.pixel);

      if (features.length > 0) {
        const feature = features[0] as Feature;
        const planta: PlantaInterface = feature.getProperties().planta;
        const informeReciente = feature.getProperties().informeReciente;

        if (!this.checkFake(planta.id)) {
          // comprobamos si es una planta que solo se ve en el informe antiguo
          if (this.portfolioControlService.checkPlantaSoloWebAntigua(planta.id)) {
            this.navigateOldReport(informeReciente.id);
          } else {
            if (planta.tipo === 'seguidores') {
              this.router.navigate(['clients/tracker/' + planta.id]);
            } else if (informeReciente.fecha > GLOBAL.newReportsDate || planta.id === 'egF0cbpXnnBnjcrusoeR') {
              this.router.navigate(['clients/fixed/' + planta.id]);
            } else {
              this.openSnackBar();
            }
          }
        } else {
          this.openSnackBarDemo();
        }
      }
    });
  }

  private addPopupOverlay() {
    const container = document.getElementById('popup');

    this.popup = new Overlay({
      id: 'popup',
      element: container,
      position: undefined,
    });

    this.map.addOverlay(this.popup);
  }

  private checkFake(plantaId: string): boolean {
    const fakeIds = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
    if (fakeIds.includes(plantaId)) {
      return true;
    } else {
      return false;
    }
  }

  private navigateOldReport(informeId: string) {
    this.router.navigate(['clientes/informe-view/' + informeId + '/informe-overview']);
  }

  private openSnackBar() {
    this._snackBar.open('Planta en mantenimiento temporalmente', 'OK', {
      duration: 5000,
      verticalPosition: 'top',
    });
  }

  private openSnackBarDemo() {
    this._snackBar.open('Planta sin contenido. Acceda a "Demo 1"', '', {
      duration: 5000,
      verticalPosition: 'top',
    });
  }

  private getStyleOnHover(hovered: boolean) {
    if (hovered) {
      return (feature: Feature) => {
        if (feature !== undefined) {
          return new Style({
            image: new Icon({
              color: 'white',
              crossOrigin: 'anonymous',
              src: 'assets/icons/place_black_24dp.svg',
              // scale: 1.5,
            }),
          });
        }
      };
    } else {
      return (feature: Feature) => {
        if (feature !== undefined) {
          return new Style({
            image: new Icon({
              color: this.portfolioControlService.getColorMae(feature.getProperties().informeReciente.mae),
              crossOrigin: 'anonymous',
              src: 'assets/icons/place_black_24dp.svg',
              scale: 0.8,
            }),
          });
        }
      };
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
