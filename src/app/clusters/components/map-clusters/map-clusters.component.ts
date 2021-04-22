import { Component, OnInit } from '@angular/core';

import { switchMap, take } from 'rxjs/operators';

import TileLayer from 'ol/layer/Tile';
import { fromLonLat, transformExtent } from 'ol/proj';
import { OSM } from 'ol/source';
import XYZ from 'ol/source/XYZ';
import View from 'ol/View';
import { defaults as defaultControls } from 'ol/control.js';
import { Feature, Map } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { Vector } from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import LineString from 'ol/geom/LineString';
import { Fill, Stroke, Style } from 'ol/style';
import Circle from 'ol/geom/Circle';

import { PlantaService } from '@core/services/planta.service';
import { OlMapService } from '@core/services/ol-map.service';
import { ClustersService } from '@core/services/clusters.service';

import { PlantaInterface } from '@core/models/planta';
import { PuntoTrayectoria } from '@core/models/puntoTrayectoria';
import { Cluster } from '@core/models/cluster';
import { GLOBAL } from '@core/services/global';
import { Select } from 'ol/interaction';
import { click } from 'ol/events/condition';
import VectorLayer from 'ol/layer/Vector';

@Component({
  selector: 'app-map-clusters',
  templateUrl: './map-clusters.component.html',
  styleUrls: ['./map-clusters.component.css'],
})
export class MapClustersComponent implements OnInit {
  private plantaId: string;
  private planta: PlantaInterface;
  private aerialLayer: TileLayer;
  private satelliteLayer: TileLayer;
  private map: Map;
  private coordsPuntosTrayectoria: Coordinate[] = [];
  private prevFeatureHover: any;
  private puntosTrayectoria: PuntoTrayectoria[] = [];
  private puntoClusterHovered: PuntoTrayectoria;
  private puntoClusterSelected: PuntoTrayectoria;
  private clusters: Cluster[];
  private clusterSelected: Cluster;
  private isClusterA: boolean;
  private deleteMode = false;
  private joinActive = false;

  constructor(
    private plantaService: PlantaService,
    private olMapService: OlMapService,
    private clustersService: ClustersService
  ) {}

  ngOnInit(): void {
    this.planta = this.clustersService.planta;
    this.coordsPuntosTrayectoria = this.clustersService.coordsPuntosTrayectoria;
    this.puntosTrayectoria = this.clustersService.puntosTrayectoria;
    this.clustersService.deleteMode$.subscribe((del) => (this.deleteMode = del));
    this.clustersService.joinActive$.subscribe((joi) => (this.joinActive = joi));
    this.clustersService.clusterSelected$.subscribe((cluster) => (this.clusterSelected = cluster));

    this.initMap();

    this.addTrayectoria();
    this.addPuntosTrayectoria();
    this.createClustersLayer();
    this.addClusters();

    this.addPointerOnHover();
    this.addOnHoverPointAction();
    this.addOnHoverClusterAction();
    this.addSelectClusterInteraction();
    this.addSelectPuntosTrayectoriaInteraction();
  }

  initMap() {
    const satellite = new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: '',
    });
    this.satelliteLayer = new TileLayer({
      source: satellite,
    });

    const aerial = new XYZ({
      url: 'https://solardrontech.es/demo_rgb/{z}/{x}/{y}.png',
      crossOrigin: '',
    });

    this.aerialLayer = new TileLayer({
      source: aerial,
    });

    const layers = [this.satelliteLayer];

    // MAPA
    const view = new View({
      center: fromLonLat([this.planta.longitud, this.planta.latitud]),
      // zoom: 18,
      zoom: this.planta.zoom,
      minZoom: this.planta.zoom,
      maxZoom: 20,
      // extent: this.transform([-7.060903, 38.523993, -7.0556, 38.522264]),
    });

    this.olMapService
      .createMap('map', layers, view, defaultControls({ attribution: false }))
      .pipe(take(1))
      .subscribe((map) => {
        this.map = map;
      });
  }

  private transform(extent) {
    return transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
  }

  private addTrayectoria() {
    const trayectoria = new Vector({
      source: new VectorSource({
        features: [
          new Feature({
            geometry: new LineString(this.coordsPuntosTrayectoria),
            name: 'trayectoria',
            properties: {
              id: 'trayectoria',
            },
          }),
        ],
      }),
      style: new Style({
        stroke: new Stroke({
          color: 'white',
          width: 4,
        }),
      }),
    });

    this.map.addLayer(trayectoria);
  }

  private addPuntosTrayectoria() {
    const features: Feature[] = [];

    this.puntosTrayectoria.forEach((punto) => {
      const feature = new Feature({
        geometry: new Circle(fromLonLat([punto.long, punto.lat])),
        properties: {
          id: punto.id,
          name: 'puntoTrayectoria',
        },
      });
      features.push(feature);
    });

    const puntos = new Vector({
      source: new VectorSource({
        features,
      }),
      style: this.getStylePuntos(false),
    });

    puntos.setProperties({
      id: 'puntosTrayectoriaLayer',
    });

    this.map.addLayer(puntos);
  }

  private createClustersLayer() {
    const layer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleCluster(false),
    });

    layer.setProperties({
      id: 'clustersLayer',
    });

    this.map.addLayer(layer);
  }

  private addClusters() {
    this.clustersService.clusters$.subscribe((clusters) => {
      this.clusters = clusters;
      const clustersLayer = this.map
        .getLayers()
        .getArray()
        .find((layer) => layer.getProperties().id === 'clustersLayer') as VectorLayer;

      const clustersSource = clustersLayer.getSource();
      clustersSource.clear();

      clusters.forEach((cluster) => {
        const featureA = new Feature({
          geometry: new Circle(fromLonLat(cluster.extremoA)),
          properties: {
            id: cluster.id,
            name: 'puntoClusterA',
          },
        });
        clustersSource.addFeature(featureA);

        const featureB = new Feature({
          geometry: new Circle(fromLonLat(cluster.extremoB)),
          properties: {
            id: cluster.id,
            name: 'puntoClusterB',
          },
        });
        clustersSource.addFeature(featureB);
      });
    });
  }

  private addPointerOnHover() {
    this.map.on('pointermove', (event) => {
      if (this.map.hasFeatureAtPixel(event.pixel)) {
        let feature = this.map
          .getFeaturesAtPixel(event.pixel)
          .filter((item) => item.getProperties().properties !== undefined);
        feature = feature.filter(
          (item) =>
            item.getProperties().properties.name === 'puntoTrayectoria' ||
            item.getProperties().properties.name === 'puntoClusterA' ||
            item.getProperties().properties.name === 'puntoClusterB'
        );

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

  private addOnHoverPointAction() {
    let currentFeatureHover;
    this.map.on('pointermove', (event) => {
      if (this.map.hasFeatureAtPixel(event.pixel)) {
        const feature = this.map
          .getFeaturesAtPixel(event.pixel)
          .filter((item) => item.getProperties().properties !== undefined)
          .filter((item) => item.getProperties().properties.name === 'puntoTrayectoria');

        if (feature.length > 0 && this.puntoClusterHovered === undefined) {
          // cuando pasamos de un punto a otro directamente sin pasar por vacio
          if (this.prevFeatureHover !== undefined && this.prevFeatureHover !== feature) {
            (this.prevFeatureHover[0] as Feature).setStyle(this.getStylePuntos(false));
          }
          currentFeatureHover = feature;

          const puntoId = feature[0].getProperties().properties.id;
          const puntoHover = this.puntosTrayectoria.find((punto) => punto.id === puntoId);

          this.clustersService.getImageThumbnail(puntoHover.thumbnail);

          (feature[0] as Feature).setStyle(this.getStylePuntos(true));

          this.prevFeatureHover = feature;
        }
      } else {
        if (currentFeatureHover !== undefined) {
          (currentFeatureHover[0] as Feature).setStyle(this.getStylePuntos(false));
        }
      }
    });
  }

  private addOnHoverClusterAction() {
    let currentFeatureHover;
    this.map.on('pointermove', (event) => {
      if (this.clusterSelected === undefined) {
        if (this.map.hasFeatureAtPixel(event.pixel)) {
          const feature = this.map
            .getFeaturesAtPixel(event.pixel)
            .filter((item) => item.getProperties().properties !== undefined)
            .filter(
              (item) =>
                item.getProperties().properties.name === 'puntoClusterA' ||
                item.getProperties().properties.name === 'puntoClusterB'
            );

          if (feature.length > 0) {
            currentFeatureHover = feature;
            if (feature[0].getProperties().properties.name === 'puntoClusterA') {
              this.isClusterA = true;
            } else {
              this.isClusterA = false;
            }

            const clusterId = feature[0].getProperties().properties.id;
            const puntoEquivalente = this.getPuntoEquivalente(clusterId);
            this.puntoClusterHovered = puntoEquivalente;

            this.clustersService.getImageThumbnail(puntoEquivalente.thumbnail);

            (feature[0] as Feature).setStyle(this.getStyleCluster(true));
          }
        } else {
          this.puntoClusterHovered = undefined;
          if (currentFeatureHover !== undefined) {
            (currentFeatureHover[0] as Feature).setStyle(this.getStyleCluster(false));
          }
        }
      }
    });
  }

  private addSelectClusterInteraction() {
    const select = new Select({
      style: this.getStyleCluster(true),
      condition: click,
      layers: (l) => {
        if (l.getProperties().id === 'clustersLayer') {
          return true;
        } else {
          return false;
        }
      },
    });

    select.setProperties({ id: 'clusterSelected' });

    this.map.addInteraction(select);
    select.on('select', (e) => {
      if (this.puntoClusterSelected !== undefined) {
        // this.puntoClusterSelected = undefined;
      }
      if (this.clusterSelected !== undefined) {
        this.setClusterStyle(this.clusterSelected.id, false);
        // this.clustersService.clusterSelected = undefined;
      }

      if (e.selected.length > 0) {
        if (e.selected[0].getProperties().properties !== undefined) {
          if (
            e.selected[0].getProperties().properties.name === 'puntoClusterA' ||
            e.selected[0].getProperties().properties.name === 'puntoClusterB'
          ) {
          }
          if (e.selected[0].getProperties().properties.name === 'puntoClusterA') {
            this.isClusterA = true;
          } else if (e.selected[0].getProperties().properties.name === 'puntoClusterB') {
            this.isClusterA = false;
          }
          const clusterId = e.selected[0].getProperties().properties.id;

          if (this.deleteMode) {
            // si el modo ELIMINAR esta activo eliminamos los clusters al hacer click
            this.clustersService.deleteCluster(clusterId);

            this.puntoClusterSelected = undefined;
          } else if (this.joinActive) {
            // si JOIN se encuentra active se asocida este clusterId al cluster anterior seleccionado
            this.clustersService.joinClusters(this.clusterSelected.id, clusterId);

            this.clustersService.joinActive = false;

            this.clustersService.clusterSelected = undefined;
            this.puntoClusterSelected = undefined;
          } else {
            this.setClusterStyle(clusterId, true);

            this.clustersService.clusterSelected = this.clusters.find((cluster) => cluster.id === clusterId);

            const puntoEquivalente = this.getPuntoEquivalente(clusterId);

            this.puntoClusterSelected = puntoEquivalente;
          }

          this.puntoClusterHovered = undefined;
        }
      }
    });
  }

  private addSelectPuntosTrayectoriaInteraction() {
    const select = new Select({
      // style: this.getStylePuntos(true),
      condition: click,
      layers: (l) => {
        if (l.getProperties().id === 'puntosTrayectoriaLayer') {
          return true;
        } else {
          return false;
        }
      },
    });

    select.setProperties({ id: 'clusterSelected' });

    this.map.addInteraction(select);
    select.on('select', (e) => {
      if (this.puntoClusterSelected !== undefined) {
        if (e.selected.length > 0) {
          if (
            e.selected[0].getProperties().properties !== undefined &&
            e.selected[0].getProperties().properties.name === 'puntoTrayectoria'
          ) {
            if (!this.deleteMode) {
              const puntoId = e.selected[0].getProperties().properties.id;
              const puntoSelected = this.puntosTrayectoria.find((punto) => punto.id === puntoId);

              if (!this.esPuntoCluster(puntoSelected)) {
                // Actualizamos el punto cluster seleccionado solo si no pulsamos sobre otro cluster
                this.clustersService.updateCluster(this.clusterSelected.id, this.isClusterA, [
                  puntoSelected.long,
                  puntoSelected.lat,
                ]);
              }
            }

            this.puntoClusterSelected = undefined;
            this.puntoClusterHovered = undefined;
          }
        }
      }
    });
  }

  private addClickOutFeatures() {
    this.map.on('click', (event) => {
      const feature = this.map
        .getFeaturesAtPixel(event.pixel)
        .filter((item) => item.getProperties().properties !== undefined);

      if (feature.length === 0) {
        if (this.clusterSelected !== undefined) {
          this.setClusterStyle(this.clusterSelected.id, false);
        }
        this.puntoClusterSelected = undefined;
        this.clustersService.clusterSelected = undefined;
      }
    });
  }

  private getStylePuntos(hovered: boolean) {
    if (hovered) {
      return (feature: Feature) => {
        if (feature !== undefined) {
          return new Style({
            stroke: new Stroke({
              color: 'red',
              width: 10,
            }),
          });
        }
      };
    } else {
      return (feature: Feature) => {
        if (feature !== undefined) {
          return new Style({
            stroke: new Stroke({
              color: 'black',
              width: 6,
            }),
          });
        }
      };
    }
  }

  private getStyleCluster(hovered: boolean) {
    if (hovered) {
      return (feature: Feature) => {
        if (feature !== undefined) {
          return new Style({
            fill: new Fill({
              color: this.getClusterColor(feature.getProperties().properties.id),
            }),
            stroke: new Stroke({
              color: 'white',
              width: 20,
            }),
          });
        }
      };
    } else {
      return (feature: Feature) => {
        if (feature !== undefined) {
          return new Style({
            stroke: new Stroke({
              color: this.getClusterColor(feature.getProperties().properties.id),
              width: 20,
            }),
          });
        }
      };
    }
  }

  private setClusterStyle(clusterId: string, focus: boolean) {
    this.clusters.find((cluster) => cluster.id === clusterId);

    const clustersLayer = this.map
      .getLayers()
      .getArray()
      .find((layer) => layer.getProperties().id === 'clustersLayer') as VectorLayer;

    const features = clustersLayer.getSource().getFeatures();

    let feature: Feature;
    if (this.isClusterA) {
      feature = features.find(
        (f) => f.getProperties().properties.id === clusterId && f.getProperties().properties.name === 'puntoClusterA'
      );
    } else {
      feature = features.find(
        (f) => f.getProperties().properties.id === clusterId && f.getProperties().properties.name === 'puntoClusterB'
      );
    }

    const focusedStyle = new Style({
      stroke: new Stroke({
        color: 'white',
        width: 20,
      }),
    });

    const unfocusedStyle = new Style({
      stroke: new Stroke({
        color: this.getClusterColor(feature.getProperties().properties.id),
        width: 20,
      }),
    });

    if (focus) {
      feature.setStyle(focusedStyle);
    } else {
      feature.setStyle(unfocusedStyle);
    }
  }

  private getClusterColor(clusterId: string) {
    const cluster = this.clusters.find((cluster) => cluster.id === clusterId);
    const colorAleatorio = GLOBAL.clusterColors[Math.round(Math.random() * (GLOBAL.clusterColors.length - 1))];
    // comprobamos si tiene ya un color asignado
    if (cluster.color !== undefined) {
      return cluster.color;
    } else {
      cluster.color = colorAleatorio;
      return colorAleatorio;
    }
  }

  private getPuntoEquivalente(clusterId: string): PuntoTrayectoria {
    const cluster = this.clusters.find((cluster) => cluster.id === clusterId);
    let puntoEquivalente;
    if (this.isClusterA) {
      puntoEquivalente = this.puntosTrayectoria.find(
        (punto) =>
          // tslint:disable-next-line: triple-equals
          punto.long == cluster.extremoA[0] && punto.lat == cluster.extremoA[1]
      );
    } else {
      puntoEquivalente = this.puntosTrayectoria.find(
        (punto) =>
          // tslint:disable-next-line: triple-equals
          punto.long == cluster.extremoB[0] && punto.lat == cluster.extremoB[1]
      );
    }
    return puntoEquivalente;
  }

  private esPuntoCluster(punto: PuntoTrayectoria): boolean {
    let clusterEquivalente = this.clusters.find(
      (cluster) =>
        // tslint:disable-next-line: triple-equals
        punto.long == cluster.extremoA[0] && punto.lat == cluster.extremoA[1]
    );
    if (clusterEquivalente) {
      return true;
    } else {
      clusterEquivalente = this.clusters.find(
        (cluster) =>
          // tslint:disable-next-line: triple-equals
          punto.long == cluster.extremoB[0] && punto.lat == cluster.extremoB[1]
      );
      if (clusterEquivalente) {
        return true;
      } else {
        return false;
      }
    }
  }
}
