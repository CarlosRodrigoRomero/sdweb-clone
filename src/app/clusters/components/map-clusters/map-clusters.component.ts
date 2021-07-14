import { Component, OnInit } from '@angular/core';

import { HotkeysService, Hotkey } from 'angular2-hotkeys';

import { take } from 'rxjs/operators';

import TileLayer from 'ol/layer/Tile';
import { fromLonLat, transformExtent } from 'ol/proj';
import XYZ from 'ol/source/XYZ';
import View from 'ol/View';
import { defaults as defaultControls } from 'ol/control.js';
import { Feature, Map } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { Vector } from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import LineString from 'ol/geom/LineString';
import { Fill, Stroke, Style, Text } from 'ol/style';
import Circle from 'ol/geom/Circle';
import { Select } from 'ol/interaction';
import { click } from 'ol/events/condition';
import VectorLayer from 'ol/layer/Vector';

import { OlMapService } from '@core/services/ol-map.service';
import { ClustersService } from '@core/services/clusters.service';

import { PlantaInterface } from '@core/models/planta';
import { PuntoTrayectoria } from '@core/models/puntoTrayectoria';
import { Cluster } from '@core/models/cluster';
import { GLOBAL } from '@core/services/global';

@Component({
  selector: 'app-map-clusters',
  templateUrl: './map-clusters.component.html',
  styleUrls: ['./map-clusters.component.css'],
})
export class MapClustersComponent implements OnInit {
  private planta: PlantaInterface;
  private satelliteLayer: TileLayer;
  private map: Map;
  private coordsPuntosTrayectoria: Coordinate[] = [];
  private prevFeatureHover: Feature;
  private puntosTrayectoria: PuntoTrayectoria[] = [];
  private prevPuntoTrayectoriaSelected: PuntoTrayectoria;
  private puntoTrayectoriaSelected: PuntoTrayectoria;
  private puntoClusterHovered: PuntoTrayectoria;
  private clusters: Cluster[];
  private clusterSelected: Cluster;
  private isClusterA: boolean;
  private deleteMode = false;
  private joinActive = false;
  private createClusterActive = false;

  constructor(
    private olMapService: OlMapService,
    private clustersService: ClustersService,
    private hotkeysService: HotkeysService
  ) {}

  ngOnInit(): void {
    this.planta = this.clustersService.planta;
    this.coordsPuntosTrayectoria = this.clustersService.coordsPuntosTrayectoria;
    this.puntosTrayectoria = this.clustersService.puntosTrayectoria;
    this.clustersService.joinActive$.subscribe((joi) => (this.joinActive = joi));
    this.clustersService.clusterSelected$.subscribe((cluster) => (this.clusterSelected = cluster));
    this.clustersService.createClusterActive$.subscribe((create) => (this.createClusterActive = create));

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
    this.addClickOutFeatures();

    // ATAJOS DE TECLADO DESPLAZAMIENTO FLECHAS
    this.hotkeysService.add(
      new Hotkey(
        'left',
        (event: KeyboardEvent): boolean => {
          if (this.puntoTrayectoriaSelected !== undefined) {
            // si esta activo el modo crea cluster seleccionamos un nuevo punto de la trayectoria
            if (this.createClusterActive && this.prevPuntoTrayectoriaSelected === undefined) {
              this.prevPuntoTrayectoriaSelected = this.puntoTrayectoriaSelected;
            }
            const index = this.puntosTrayectoria.indexOf(this.puntoTrayectoriaSelected);
            if (index > 0) {
              // reseteamos el estilo al anterior
              this.setPuntosStyle(this.puntoTrayectoriaSelected.id, false);

              // seleccionamos el nuevo punto y le aplicamos el estilo de seleccionado
              this.puntoTrayectoriaSelected = this.puntosTrayectoria[index - 1];
              this.setPuntosStyle(this.puntoTrayectoriaSelected.id, true);

              // mostramos la miniatura asociada a este punto
              this.clustersService.getImageThumbnail(this.puntoTrayectoriaSelected.thumbnail);
            }
          }
          return false; // Prevent bubbling
        },
        undefined,
        'left arrow'
      )
    );
    this.hotkeysService.add(
      new Hotkey(
        'right',
        (event: KeyboardEvent): boolean => {
          if (this.puntoTrayectoriaSelected !== undefined) {
            // si esta activo el modo crea cluster seleccionamos un nuevo punto de la trayectoria
            if (this.createClusterActive && this.prevPuntoTrayectoriaSelected === undefined) {
              this.prevPuntoTrayectoriaSelected = this.puntoTrayectoriaSelected;
            }
            const index = this.puntosTrayectoria.indexOf(this.puntoTrayectoriaSelected);
            if (index < this.puntosTrayectoria.length) {
              // reseteamos el estilo al anterior
              this.setPuntosStyle(this.puntoTrayectoriaSelected.id, false);

              // seleccionamos el nuevo punto y le aplicamos el estilo de seleccionado
              this.puntoTrayectoriaSelected = this.puntosTrayectoria[index + 1];
              this.setPuntosStyle(this.puntoTrayectoriaSelected.id, true);

              // mostramos la miniatura asociada a este punto
              this.clustersService.getImageThumbnail(this.puntoTrayectoriaSelected.thumbnail);
            }
          }
          return false; // Prevent bubbling
        },
        undefined,
        'right arrow'
      )
    );
    this.hotkeysService.add(
      new Hotkey(
        'enter',
        (event: KeyboardEvent): boolean => {
          if (this.puntoTrayectoriaSelected !== undefined && this.prevPuntoTrayectoriaSelected !== undefined) {
            const cluster: Cluster = {
              puntoAId: this.prevPuntoTrayectoriaSelected.id,
              puntoBId: this.puntoTrayectoriaSelected.id,
            };

            this.clustersService.addCluster(cluster);

            this.prevPuntoTrayectoriaSelected = undefined;
            this.puntoTrayectoriaSelected = undefined;
            this.clustersService.createClusterActive = false;
          }
          return false; // Prevent bubbling
        },
        undefined,
        'right arrow'
      )
    );
  }

  initMap() {
    const satellite = new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: '',
    });
    this.satelliteLayer = new TileLayer({
      source: satellite,
    });

    const layers = [this.satelliteLayer];

    // MAPA
    const view = new View({
      center: fromLonLat([this.planta.longitud, this.planta.latitud]),
      zoom: this.planta.zoom,
      minZoom: this.planta.zoom,
      maxZoom: 20,
    });

    this.olMapService
      .createMap('map', layers, view, defaultControls({ attribution: false }))
      .pipe(take(1))
      .subscribe((map) => {
        this.map = map;
      });
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
        geometry: new Circle(fromLonLat([punto.long, punto.lat]), 1),
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
      if (clusters !== undefined) {
        this.clusters = clusters;
        const clustersLayer = this.map
          .getLayers()
          .getArray()
          .find((layer) => layer.getProperties().id === 'clustersLayer') as VectorLayer;

        const clustersSource = clustersLayer.getSource();
        clustersSource.clear();

        clusters.forEach((cluster) => {
          const isJoined = this.isJoinedCluster(cluster);

          const puntoA = this.puntosTrayectoria.find((punto) => punto.id === cluster.puntoAId);
          if (puntoA !== undefined) {
            const featureA = new Feature({
              geometry: new Circle(fromLonLat([puntoA.long, puntoA.lat]), 4),
              properties: {
                id: cluster.id,
                name: 'puntoClusterA',
                isJoined,
              },
            });
            clustersSource.addFeature(featureA);
          }

          const puntoB = this.puntosTrayectoria.find((punto) => punto.id === cluster.puntoBId);
          if (puntoB !== undefined) {
            const featureB = new Feature({
              geometry: new Circle(fromLonLat([puntoB.long, puntoB.lat]), 4),
              properties: {
                id: cluster.id,
                name: 'puntoClusterB',
                isJoined,
              },
            });
            clustersSource.addFeature(featureB);
          }
        });
      }
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
    let currentFeatureHover: Feature;
    this.map.on('pointermove', (event) => {
      if (this.puntoTrayectoriaSelected === undefined) {
        if (this.map.hasFeatureAtPixel(event.pixel)) {
          const feature = this.map
            .getFeaturesAtPixel(event.pixel)
            .filter((item) => item.getProperties().properties !== undefined)
            .filter((item) => item.getProperties().properties.name === 'puntoTrayectoria')[0] as Feature;

          if (feature !== undefined && this.puntoClusterHovered === undefined) {
            // cuando pasamos de un punto a otro directamente sin pasar por vacio
            if (this.prevFeatureHover !== undefined && this.prevFeatureHover !== feature) {
              this.prevFeatureHover.setStyle(this.getStylePuntos(false));
              this.prevFeatureHover = undefined;
            }
            currentFeatureHover = feature;

            const puntoId = feature.getProperties().properties.id;
            const puntoHover = this.puntosTrayectoria.find((punto) => punto.id === puntoId);

            // mostramos la miniatura asociada a este punto
            this.clustersService.getImageThumbnail(puntoHover.thumbnail);

            feature.setStyle(this.getStylePuntos(true));

            this.prevFeatureHover = feature;
          }
        } else {
          if (currentFeatureHover !== undefined) {
            currentFeatureHover.setStyle(this.getStylePuntos(false));
            currentFeatureHover = undefined;
          }
        }
      }
    });
  }

  private addOnHoverClusterAction() {
    let currentFeatureHover;
    this.map.on('pointermove', (event) => {
      if (this.clusterSelected === undefined && this.puntoTrayectoriaSelected === undefined) {
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
            currentFeatureHover = undefined;
          }
        }
      }
    });
  }

  private addSelectPuntosTrayectoriaInteraction() {
    const select = new Select({
      style: this.getStylePuntos(false),
      condition: click,
      layers: (l) => {
        if (l.getProperties().id === 'puntosTrayectoriaLayer') {
          return true;
        } else {
          return false;
        }
      },
    });

    this.map.addInteraction(select);
    select.on('select', (e) => {
      if (e.selected.length > 0) {
        // comprobamos que no sea un punto con un cluster
        const puntoId: string = e.selected[0].getProperties().properties.id;
        const puntoSelected = this.puntosTrayectoria.find((punto) => punto.id === puntoId);
        if (!this.esPuntoCluster(puntoSelected)) {
          if (this.createClusterActive) {
            if (this.puntoTrayectoriaSelected !== undefined) {
              const cluster: Cluster = {
                puntoAId: this.puntoTrayectoriaSelected.id,
                puntoBId: puntoSelected.id,
              };

              this.clustersService.addCluster(cluster);

              this.puntoTrayectoriaSelected = undefined;
              this.clustersService.createClusterActive = false;
            } else {
              this.puntoTrayectoriaSelected = this.puntosTrayectoria.find((punto) => punto.id === puntoId);
            }
          } else {
            if (this.clusterSelected !== undefined) {
              if (!this.deleteMode && !this.joinActive) {
                // Actualizamos el punto cluster seleccionado solo si no pulsamos sobre otro cluster
                this.clustersService.updateCluster(this.clusterSelected.id, this.isClusterA, puntoSelected.id);
              }

              this.clustersService.clusterSelected = undefined;
              this.puntoClusterHovered = undefined;
            } else {
              this.puntoTrayectoriaSelected = this.puntosTrayectoria.find((punto) => punto.id === puntoId);

              const feature = e.selected[0];
              feature.setStyle(this.getStylePuntos(true));
            }
          }
        }
      }
    });
  }

  private addSelectClusterInteraction() {
    const select = new Select({
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
      if (this.clusterSelected !== undefined) {
        this.setClusterStyle(this.clusterSelected.id, false);
      }
      if (e.selected.length > 0) {
        if (e.selected[0].getProperties().properties.name === 'puntoClusterA') {
          this.isClusterA = true;
        } else if (e.selected[0].getProperties().properties.name === 'puntoClusterB') {
          this.isClusterA = false;
        }
        const clusterId = e.selected[0].getProperties().properties.id;

        if (this.joinActive) {
          // si JOIN se encuentra active se asocida este clusterId al cluster anterior seleccionado
          this.clustersService.joinClusters(this.clusterSelected.id, clusterId);

          this.clustersService.joinActive = false;

          this.clustersService.clusterSelected = undefined;

          this.puntoTrayectoriaSelected = undefined;
        } else {
          this.setClusterStyle(clusterId, true);
          this.clustersService.clusterSelected = this.clusters.find((cluster) => cluster.id === clusterId);

          // quitamos el punto seleccionado y le reseteamos el estilo
          if (this.puntoTrayectoriaSelected !== undefined) {
            this.setPuntosStyle(this.puntoTrayectoriaSelected.id, false);
            this.puntoTrayectoriaSelected = undefined;
          }
        }

        this.puntoClusterHovered = undefined;
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
        this.clustersService.clusterSelected = undefined;

        if (this.puntoTrayectoriaSelected !== undefined) {
          this.setPuntosStyle(this.puntoTrayectoriaSelected.id, false);
          this.puntoTrayectoriaSelected = undefined;
        }
      }
    });
  }

  private getStylePuntos(focused: boolean) {
    if (focused) {
      return (feature: Feature) => {
        if (feature !== undefined) {
          return new Style({
            fill: new Fill({
              color: 'red',
            }),
            stroke: new Stroke({
              color: 'red',
              width: 4,
            }),
          });
        }
      };
    } else {
      return (feature: Feature) => {
        if (feature !== undefined) {
          return new Style({
            fill: new Fill({
              color: 'black',
            }),
          });
        }
      };
    }
  }

  private setPuntosStyle(puntoId: string, focus: boolean) {
    const trayectoriaLayer = this.map
      .getLayers()
      .getArray()
      .find((layer) => layer.getProperties().id === 'puntosTrayectoriaLayer') as VectorLayer;

    const features = trayectoriaLayer.getSource().getFeatures();

    const feature: Feature = features.find((f) => f.getProperties().properties.id === puntoId);

    const focusedStyle = new Style({
      fill: new Fill({
        color: 'red',
      }),
      stroke: new Stroke({
        color: 'red',
        width: 4,
      }),
    });

    const unfocusedStyle = new Style({
      fill: new Fill({
        color: 'black',
      }),
    });

    if (focus) {
      feature.setStyle(focusedStyle);
    } else {
      feature.setStyle(unfocusedStyle);
    }
  }

  private getStyleCluster(hovered: boolean) {
    if (hovered) {
      return (feature: Feature) => {
        if (feature !== undefined) {
          return new Style({
            fill: new Fill({
              color: 'white',
            }),
            text: new Text({
              placement: 'point',
              fill: new Fill({
                color: 'black',
              }),
              text: feature.getProperties().properties.id.slice(0, 3),
            }),
          });
        }
      };
    } else {
      return (feature: Feature) => {
        if (feature !== undefined) {
          if (feature.getProperties().properties.isJoined) {
            return new Style({
              fill: new Fill({
                color: this.getClusterColor(feature.getProperties().properties.id),
              }),
              stroke: new Stroke({
                color: 'white',
                width: 2,
              }),
              text: new Text({
                placement: 'point',
                fill: new Fill({
                  color: 'black',
                }),
                text: feature.getProperties().properties.id.slice(0, 3),
              }),
            });
          } else {
            return new Style({
              fill: new Fill({
                color: this.getClusterColor(feature.getProperties().properties.id),
              }),
              text: new Text({
                placement: 'point',
                fill: new Fill({
                  color: 'black',
                }),
                text: feature.getProperties().properties.id.slice(0, 3),
              }),
            });
          }
        }
      };
    }
  }

  private setClusterStyle(clusterId: string, focus: boolean) {
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
      fill: new Fill({
        color: 'white',
      }),
    });

    const unfocusedStyle = new Style({
      fill: new Fill({
        color: this.getClusterColor(feature.getProperties().properties.id),
      }),
      stroke: new Stroke({
        color: 'white',
        width: 2,
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
      const puntoA = this.puntosTrayectoria.find((punto) => punto.id === cluster.puntoAId);
      puntoEquivalente = this.puntosTrayectoria.find(
        (punto) =>
          // tslint:disable-next-line: triple-equals
          punto.long == puntoA.long && punto.lat == puntoA.lat
      );
    } else {
      const puntoB = this.puntosTrayectoria.find((punto) => punto.id === cluster.puntoBId);
      puntoEquivalente = this.puntosTrayectoria.find(
        (punto) =>
          // tslint:disable-next-line: triple-equals
          punto.long == puntoB.long && punto.lat == puntoB.lat
      );
    }
    return puntoEquivalente;
  }

  private esPuntoCluster(punto: PuntoTrayectoria): boolean {
    if (this.clusters !== undefined) {
      let clusterEquivalente = this.clusters.find((cluster) => {
        const puntoA = this.puntosTrayectoria.find((p) => p.id === cluster.puntoAId);

        if (puntoA !== undefined) {
          // tslint:disable-next-line: triple-equals
          return punto.long == puntoA.long && punto.lat == puntoA.lat;
        }
      });

      if (clusterEquivalente) {
        return true;
      } else {
        clusterEquivalente = this.clusters.find((cluster) => {
          const puntoB = this.puntosTrayectoria.find((p) => p.id === cluster.puntoBId);

          if (puntoB !== undefined) {
            // tslint:disable-next-line: triple-equals
            return punto.long == puntoB.long && punto.lat == puntoB.lat;
          }
        });
        if (clusterEquivalente) {
          return true;
        } else {
          return false;
        }
      }
    }
  }

  private isJoinedCluster(cluster: Cluster) {
    if (cluster.clusterJoinId !== undefined) {
      return true;
    } else {
      const clusterJoin = this.clusters.find((c) => c.clusterJoinId === cluster.id);
      if (clusterJoin !== undefined) {
        return true;
      } else {
        return false;
      }
    }
  }
}
