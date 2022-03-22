import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { MatSnackBar } from '@angular/material/snack-bar';

import { Subscription } from 'rxjs';

import 'ol/ol.css';
import { defaults as defaultControls } from 'ol/control.js';
import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import { Icon, Style } from 'ol/style';
import { Vector as VectorSource, XYZ } from 'ol/source';
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
  selector: 'app-plants-map',
  templateUrl: './plants-map.component.html',
  styleUrls: ['./plants-map.component.css'],
})
export class PlantsMapComponent implements OnInit, OnDestroy {
  private plantas: PlantaInterface[];
  private informes: InformeInterface[];
  defaultLng = -4;
  defaultLat = 40;
  defaultZoom = 5.5;
  geojsonObject: any;
  map: Map;
  plantaHovered: PlantaInterface;
  private popup: Overlay;
  labelPlanta: string;
  private plantasSource: VectorSource;
  private prevPlantaHovered: PlantaInterface;

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
        if (this.map !== undefined) {
          this.plantaHovered = planta;
          if (planta !== undefined) {
            this.labelPlanta = planta.nombre + '  (' + planta.potencia + ' MW)';

            // cuando pasamos de una planta a otra directamente sin pasar por vacio
            if (this.prevPlantaHovered !== undefined && this.prevPlantaHovered.id !== planta.id) {
              this.setPlantaStyle(this.prevPlantaHovered.id, false);
            }

            // cambiamos el estilo a hovered
            this.setPlantaStyle(planta.id, true);

            // mostramos el popup
            this.map.getOverlayById('popup').setPosition(fromLonLat([planta.longitud, planta.latitud]));

            this.prevPlantaHovered = planta;
          } else {
            // ocultamos el popup
            this.map.getOverlayById('popup').setPosition(undefined);

            if (this.prevPlantaHovered !== undefined) {
              // cambiamos el estilo a no hovered
              this.setPlantaStyle(this.prevPlantaHovered.id, false);
            }
          }
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
    this.plantasSource = new VectorSource({});

    this.plantas.forEach((planta) => {
      const informesPlanta = this.informes.filter((informe) => informe.plantaId === planta.id);
      const informeReciente = informesPlanta.reduce((prev, current) => (prev.fecha > current.fecha ? prev : current));

      const feature = new Feature({
        geometry: new Point(fromLonLat([planta.longitud, planta.latitud])),
      });

      feature.setId(planta.id);

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

      this.plantasSource.addFeature(feature);
    });

    const plantasLayer = new VectorLayer({
      source: this.plantasSource,
      style: this.getStyleOnHover(false),
    });

    this.map.addLayer(plantasLayer);
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
    this.map.on('pointermove', (event) => {
      if (this.map.hasFeatureAtPixel(event.pixel)) {
        const features = this.map.getFeaturesAtPixel(event.pixel) as Feature[];

        if (features.length > 0) {
          const feature = features[0] as Feature;
          const planta = feature.getProperties().planta;

          this.portfolioControlService.plantaHovered = planta;
        }
      } else {
        this.portfolioControlService.plantaHovered = undefined;
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

  private setPlantaStyle(plantaId: string, hovered: boolean) {
    const feature = this.plantasSource.getFeatureById(plantaId);

    feature.setStyle(this.getStyleOnHover(hovered));
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
