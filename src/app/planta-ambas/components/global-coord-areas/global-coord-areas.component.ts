import { Component, OnDestroy, OnInit } from '@angular/core';

import { switchMap, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style, Text } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import { Coordinate } from 'ol/coordinate';
import Polygon from 'ol/geom/Polygon';
import Overlay from 'ol/Overlay';
import OverlayPositioning from 'ol/OverlayPositioning';
import Feature from 'ol/Feature';

import { LatLngLiteral } from '@agm/core';

import { PlantaService } from '@core/services/planta.service';
import { OlMapService } from '@core/services/ol-map.service';
import { ReportControlService } from '@core/services/report-control.service';
import { GLOBAL } from '@core/services/global';
import { SeguidorService } from '@core/services/seguidor.service';

import { LocationAreaInterface } from '@core/models/location';

export interface Task {
  name: string;
  completed: boolean;
  subtasks?: Task[];
}

@Component({
  selector: 'app-global-coord-areas',
  templateUrl: './global-coord-areas.component.html',
  styleUrls: ['./global-coord-areas.component.css'],
})
export class GlobalCoordAreasComponent implements OnInit, OnDestroy {
  public plantaId: string;
  private globalCoordAreas: LocationAreaInterface[][] = [];
  public globalCoordAreasVectorSources: VectorSource[] = [];
  public globalCoordAreasVectorLayers: VectorLayer[] = [];
  private nombreGlobalCoords: string[] = [];
  public map: Map;
  private subscriptions: Subscription = new Subscription();
  public numAreas: number;

  task: Task = {
    name: 'Ver zonas de la planta',
    completed: false,
    subtasks: [],
  };
  public allComplete = false;

  constructor(
    private plantaService: PlantaService,
    private olMapService: OlMapService,
    private reportControlService: ReportControlService,
    private seguidorService: SeguidorService
  ) {}

  ngOnInit(): void {
    const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
    if (this.reportControlService.plantaFija) {
      // ponemos un nombre estandar a las zonas por si no tubiese un nombre definido por la empresa
      for (let index = 0; index < this.reportControlService.numFixedGlobalCoords; index++) {
        this.nombreGlobalCoords.push('Zonas ' + letras[index]);
      }
    } else {
      if (this.seguidorService.numGlobalCoords > 1) {
        // restamos 1 al numero de global coords xq las pequeñas son los seguidores
        this.numAreas = this.seguidorService.numGlobalCoords - 1;
        for (let index = 0; index < this.numAreas; index++) {
          this.nombreGlobalCoords.push('Zonas ' + letras[index]);
        }
      } else {
        this.reportControlService.thereAreZones = false;
      }
    }

    this.subscriptions.add(
      this.reportControlService.plantaId$
        .pipe(
          switchMap((plantaId) => {
            this.plantaId = plantaId;

            return this.plantaService.getPlanta(plantaId);
          }),
          switchMap((planta) => {
            // si tiene nombres propios se los aplicamos
            if (planta.nombreGlobalCoords !== undefined && planta.nombreGlobalCoords.length > 0) {
              this.nombreGlobalCoords = planta.nombreGlobalCoords;
            }

            if (this.reportControlService.plantaFija) {
              this.numAreas = this.nombreGlobalCoords.length;
            }

            // guardamos los nombre en el servicio
            this.reportControlService.nombreGlobalCoords = this.nombreGlobalCoords;

            this.nombreGlobalCoords.forEach((nombre) => {
              this.task.subtasks.push({ name: nombre, completed: false });
            });

            return this.olMapService.getMap();
          })
        )
        .subscribe((map) => {
          this.map = map;

          this.addLocationAreas();
        })
    );
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

        // ZOOM FIJO DEMO
        if (this.map.getView().getZoom() > 20) {
          this.nombreGlobalCoords.forEach((nombre, index) => {
            if (
              feature.get('globalCoords')[index] !== null &&
              feature.get('globalCoords')[index] !== undefined &&
              feature.get('globalCoords')[index] !== ''
            ) {
              style.getText().setText(nombre + ' ' + feature.get('globalCoords')[index]);
            }
          });
        } else {
          this.nombreGlobalCoords.forEach(() => {
            style.getText().setText('');
          });
        }

        return style;
      }
    };

    /* this.seguidorService.locAreas$.pipe(take(1)).subscribe((locAreas) => {
      this.nombreGlobalCoords.forEach((nombre, i) => {
        if (this.globalCoordAreas.length < this.nombreGlobalCoords.length) {
          this.globalCoordAreas.push(
            locAreas.filter(
              (locArea) =>
                locArea.globalCoords[i] !== null &&
                locArea.globalCoords[i] !== undefined &&
                locArea.globalCoords[i] !== ''
            )
          );

          this.globalCoordAreasVectorSources[i] = new VectorSource({
            features: new GeoJSON().readFeatures(this.locAreasToGeoJSON(this.globalCoordAreas[i])),
          });
          this.globalCoordAreasVectorSources[i]
            .getFeatures()
            .forEach((feature) => feature.setProperties({ tipo: 'areaGlobalCoord' }));
          this.map.addLayer(
            (this.globalCoordAreasVectorLayers[i] = new VectorLayer({
              source: this.globalCoordAreasVectorSources[i],
              visible: false,
              style: styleFunction,
            }))
          );
        }
      });
    }); */

    this.subscriptions.add(
      this.plantaService
        .getLocationsArea(this.plantaId)
        .pipe(take(1))
        .subscribe((locAreas) => {
          // si la planta es de seguidores obtenemos las areas ya sin seguidores
          if (!this.reportControlService.plantaFija) {
            locAreas = this.seguidorService.locAreas;
          }

          this.nombreGlobalCoords.forEach((nombre, i) => {
            if (this.globalCoordAreas.length < this.nombreGlobalCoords.length) {
              this.globalCoordAreas.push(
                locAreas.filter(
                  (locArea) =>
                    locArea.globalCoords[i] !== null &&
                    locArea.globalCoords[i] !== undefined &&
                    locArea.globalCoords[i] !== ''
                )
              );

              this.globalCoordAreasVectorSources[i] = new VectorSource({
                features: new GeoJSON().readFeatures(this.locAreasToGeoJSON(this.globalCoordAreas[i])),
              });
              this.globalCoordAreasVectorSources[i]
                .getFeatures()
                .forEach((feature) => feature.setProperties({ tipo: 'areaGlobalCoord' }));
              this.map.addLayer(
                (this.globalCoordAreasVectorLayers[i] = new VectorLayer({
                  source: this.globalCoordAreasVectorSources[i],
                  visible: false,
                  style: styleFunction,
                }))
              );
            }
          });

          // this.addPointerOnHover();
          // this.addOnHoverLabel();
        })
    );
  }

  private getLabelArea(feature: Feature): string {
    if (
      feature.get('globalCoords')[0] !== null &&
      feature.get('globalCoords')[0] !== undefined &&
      feature.get('globalCoords')[0] !== ''
    ) {
      const label = 'Instalación ' + feature.get('globalCoords')[0];
      return label;
    } else if (
      feature.get('globalCoords')[1] !== null &&
      feature.get('globalCoords')[1] !== undefined &&
      feature.get('globalCoords')[1] !== ''
    ) {
      this.globalCoordAreas[0].forEach((instalacion) => {
        // obtenemos el poligono para calcular si esta dentro feature
        const polygon = new Polygon([this.pathToCoordinate(instalacion.path)]);

        if (polygon.intersectsCoordinate((feature.getGeometry() as Polygon).getCoordinates()[0][0])) {
          const label = 'Instalación ' + instalacion.globalCoords[0] + ' - Calle ' + feature.get('globalCoords')[1];
          return label;
        }
      });
    } else {
      return 'blablabla';
    }
  }

  private pathToCoordinate(path: LatLngLiteral[]): Coordinate[] {
    const coordenadas: Coordinate[] = [];
    path.forEach((coord) => {
      const coordenada: Coordinate = fromLonLat([coord.lng, coord.lat]);
      coordenadas.push(coordenada);
    });
    return coordenadas;
  }

  private addPointerOnHover() {
    this.map.on('pointermove', (event) => {
      if (this.map.hasFeatureAtPixel(event.pixel)) {
        const feature = this.map
          .getFeaturesAtPixel(event.pixel)
          .filter((item) => item.getProperties() !== undefined)
          .filter((item) => item.getProperties().tipo === 'areaGlobalCoord');

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

  private addOnHoverLabel() {
    // Overlay para los detalles de cada anomalia
    const element = document.getElementById('popup');

    const popup = new Overlay({
      element,
      positioning: OverlayPositioning.BOTTOM_CENTER,
      stopEvent: false,
      offset: [0, -10],
    });

    this.map.addOverlay(popup);

    const areaNames = ['Instalación', 'Calle', 'Mesa'];

    this.map.on('pointermove', (event) => {
      if (this.map.hasFeatureAtPixel(event.pixel)) {
        const coords = event.coordinate;
        const feature = this.map
          .getFeaturesAtPixel(event.pixel)
          .filter((item) => item.getProperties() !== undefined)
          .filter((item) => item.getProperties().tipo === 'areaGlobalCoord');

        if (feature.length > 0) {
          popup.setPosition(undefined);
          popup.setPosition(coords);

          for (let i = 0; i < 3; i++) {
            if (feature[0].get('globalCoords')[i] !== null) {
              element.innerHTML = areaNames[i] + ' ' + feature[0].get('globalCoords')[i];
            }
          }
        } else {
          popup.setPosition(undefined);
        }
      } else {
        popup.setPosition(undefined);
      }
    });
  }

  private locAreasToGeoJSON(locAreas: LocationAreaInterface[]) {
    let listOfFeatures = [];
    locAreas.forEach((locArea) => {
      let coordsList = [];
      locArea.path.forEach((coords) => {
        coordsList.push(fromLonLat([coords.lng, coords.lat]));
      });
      // Al ser un poligono, la 1era y ultima coord deben ser iguales:
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

  setVisibilityLayer(index: number) {
    this.globalCoordAreasVectorLayers[index].setVisible(this.task.subtasks[index].completed);

    this.updateAllComplete();
  }

  setVisibilityAllLayers(completed: boolean) {
    if (this.task.subtasks.every((t) => t.completed === true)) {
      this.globalCoordAreasVectorLayers.forEach((layer) => layer.setVisible(false));
    } else {
      this.globalCoordAreasVectorLayers.forEach((layer) => layer.setVisible(true));
    }

    this.setAll(completed);
  }

  updateAllComplete() {
    this.allComplete = this.task.subtasks != null && this.task.subtasks.every((t) => t.completed);
  }

  someComplete(): boolean {
    if (this.task.subtasks == null) {
      return false;
    }
    return this.task.subtasks.filter((t) => t.completed).length > 0 && !this.allComplete;
  }

  setAll(completed: boolean) {
    this.allComplete = completed;
    if (this.task.subtasks == null) {
      return;
    }
    this.task.subtasks.forEach((t) => (t.completed = completed));
  }

  stopPropagation(event) {
    event.stopPropagation();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
