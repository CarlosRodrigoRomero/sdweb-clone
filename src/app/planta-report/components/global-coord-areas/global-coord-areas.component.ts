import { Component, OnInit } from '@angular/core';

import { switchMap, take } from 'rxjs/operators';

import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style, Text } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';

import { PlantaService } from '@core/services/planta.service';
import { OlMapService } from '@core/services/ol-map.service';
import { ReportControlService } from '@core/services/report-control.service';

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
export class GlobalCoordAreasComponent implements OnInit {
  public plantaId: string;
  private globalCoordAreas: LocationAreaInterface[][] = [];
  public globalCoordAreasVectorSources: VectorSource[] = [];
  public globalCoordAreasVectorLayers: VectorLayer[] = [];
  public map: Map;

  task: Task = {
    name: 'Mostrar todas las áreas',
    completed: true,
    subtasks: [
      { name: 'Instalación', completed: true },
      { name: 'Calle', completed: true },
      { name: 'Mesa', completed: true },
    ],
  };
  public allComplete = true;

  constructor(
    private plantaService: PlantaService,
    private olMapService: OlMapService,
    private reportControlService: ReportControlService
  ) {}

  ngOnInit(): void {
    this.reportControlService.plantaId$
      .pipe(
        switchMap((plantaId) => {
          this.plantaId = plantaId;

          return this.olMapService.getMap();
        })
      )
      .subscribe((map) => {
        this.map = map;
        this.addLocationAreas();
      });
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
        // style.getText().setText(feature.get('globalCoords'));
        // para la demo
        style.getText().setText(feature.get('globalCoords')[1]);
        return style;
      }
    };

    this.plantaService.getLocationsArea(this.plantaId).subscribe((locAreas) => {
      for (let i = 0; i < 3; i++) {
        if (this.globalCoordAreas.length < 3) {
          this.globalCoordAreas.push(locAreas.filter((locArea) => locArea.globalCoords[i] !== null));
          this.globalCoordAreasVectorSources[i] = new VectorSource({
            features: new GeoJSON().readFeatures(this.locAreasToGeoJSON(this.globalCoordAreas[i])),
          });
          this.map.addLayer(
            (this.globalCoordAreasVectorLayers[i] = new VectorLayer({
              source: this.globalCoordAreasVectorSources[i],
              visible: true,
              style: styleFunction,
              /* style: new Style({
                stroke: new Stroke({
                  color: 'red',
                }),
              }), */
            }))
          );
        }
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
      // Al ser un poligono, la 1era y utlima coord deben ser iguales:
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
}
