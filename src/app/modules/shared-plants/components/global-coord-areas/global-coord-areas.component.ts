import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { Coordinate } from 'ol/coordinate';
import Polygon from 'ol/geom/Polygon';
import Feature from 'ol/Feature';

import { LatLngLiteral } from '@agm/core';

import { OlMapService } from '@data/services/ol-map.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ZonesService } from '@data/services/zones.service';
import { ZonesControlService } from '@data/services/zones-control.service';

import { LocationAreaInterface } from '@core/models/location';
import { PlantaInterface } from '@core/models/planta';

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
  public planta: PlantaInterface;
  private zones: LocationAreaInterface[][] = [];
  public globalCoordAreasVectorSources: VectorSource[] = [];
  public globalCoordAreasVectorLayers: VectorLayer[] = [];
  private nombreGlobalCoords: string[] = [];
  public map: Map;
  public numAreas: number;

  task: Task = {
    name: 'Ver zonas de la planta',
    completed: false,
    subtasks: [],
  };
  public allComplete = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private olMapService: OlMapService,
    private reportControlService: ReportControlService,
    private zonesService: ZonesService,
    private zonesControlService: ZonesControlService
  ) {}

  ngOnInit(): void {
    this.numAreas = this.zonesService.zonesBySize.length - 1;

    this.planta = this.reportControlService.planta;

    this.nombreGlobalCoords = this.planta.nombreGlobalCoords;
    // quitamos las más pequeñas porque ya se muestran por defecto
    this.nombreGlobalCoords.pop();

    this.nombreGlobalCoords.forEach((nombre) => {
      this.task.subtasks.push({ name: nombre, completed: false });
    });

    // quitamos las más pequeñas porque ya se muestran por defecto
    this.zones = this.zonesService.zonesBySize.filter((zones, index, allZones) => index < allZones.length - 1);

    this.subscriptions.add(
      this.olMapService.getMap().subscribe((map) => {
        this.map = map;

        if (this.map !== undefined) {
          this.addLocationAreas();
        }
      })
    );
  }

  private addLocationAreas() {
    this.zones.forEach((zones, i) => {
      this.globalCoordAreasVectorSources[i] = new VectorSource();

      zones.forEach((zone) => {
        const feature = new Feature({
          geometry: new Polygon([this.pathToCoordinate(zone.path)]),
          properties: {
            id: zone.globalCoords[i].toString(),
            tipo: 'areaGlobalCoord',
          },
        });

        this.globalCoordAreasVectorSources[i].addFeature(feature);
      });

      this.map.addLayer(
        (this.globalCoordAreasVectorLayers[i] = new VectorLayer({
          source: this.globalCoordAreasVectorSources[i],
          visible: false,
          style: this.getStyleLocAreas(),
        }))
      );
    });
  }

  private getStyleLocAreas() {
    return (feature) => {
      if (feature !== undefined) {
        return new Style({
          stroke: new Stroke({
            color: 'black',
            width: 2,
            lineDash: [4],
          }),
          fill: null,
          text: this.getLabelStyle(feature),
        });
      }
    };
  }

  private getLabelStyle(feature: Feature) {
    return new Text({
      text: feature.getProperties().properties.id,
      font: 'bold 16px Roboto',
      fill: new Fill({
        color: 'white',
      }),
      stroke: new Stroke({
        color: 'black',
        width: 8,
      }),
    });
  }

  private pathToCoordinate(path: LatLngLiteral[]): Coordinate[] {
    const coordenadas: Coordinate[] = [];
    path.forEach((coord) => {
      const coordenada: Coordinate = fromLonLat([coord.lng, coord.lat]);
      coordenadas.push(coordenada);
    });
    return coordenadas;
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
