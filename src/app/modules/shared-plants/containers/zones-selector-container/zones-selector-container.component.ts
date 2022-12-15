import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style, Text } from 'ol/style';
import Polygon from 'ol/geom/Polygon';
import Feature from 'ol/Feature';

import { OlMapService } from '@data/services/ol-map.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ZonesService } from '@data/services/zones.service';

import { LocationAreaInterface } from '@core/models/location';
import { PlantaInterface } from '@core/models/planta';

export interface Task {
  name: string;
  completed: boolean;
  subtasks?: Task[];
}

@Component({
  selector: 'app-zones-selector-container',
  templateUrl: './zones-selector-container.component.html',
  styleUrls: ['./zones-selector-container.component.css'],
})
export class ZonesSelectorContainerComponent implements OnInit, OnDestroy {
  planta: PlantaInterface;
  private zones: LocationAreaInterface[][] = [];
  globalCoordAreasVectorSources: VectorSource[] = [];
  globalCoordAreasVectorLayers: VectorLayer[] = [];
  private nombreGlobalCoords: string[] = [];
  map: Map;
  numAreas: number;

  task: Task = {
    name: 'Ver zonas de la planta',
    completed: false,
    subtasks: [],
  };
  allComplete = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private olMapService: OlMapService,
    private reportControlService: ReportControlService,
    private zonesService: ZonesService
  ) {}

  ngOnInit(): void {
    // a las plantas de seguidores les quitamos las zonas más pequeñas porque ya se muestran por defecto
    if (this.reportControlService.plantaFija) {
      this.numAreas = this.zonesService.zonesBySize.length;
    } else {
      this.numAreas = this.zonesService.zonesBySize.length - 1;
    }

    this.planta = this.reportControlService.planta;

    // comprobamos si tiene los nombres de las zonas
    if (this.reportControlService.planta.hasOwnProperty('nombreGlobalCoords')) {
      this.nombreGlobalCoords = this.planta.nombreGlobalCoords;
      // quitamos las más pequeñas en S2E porque ya se muestran por defecto
      if (!this.reportControlService.plantaFija) {
        this.nombreGlobalCoords = this.planta.nombreGlobalCoords.filter(
          (_, index, nombres) => index < nombres.length - 1
        );
      }
    } else {
      for (let index = 0; index < this.numAreas; index++) {
        this.nombreGlobalCoords.push('Zona');
      }
    }

    this.nombreGlobalCoords.forEach((nombre) => {
      this.task.subtasks.push({ name: nombre, completed: false });
    });

    this.zones = this.zonesService.zonesBySize;
    // quitamos las más pequeñas porque ya se muestran por defecto
    if (!this.reportControlService.plantaFija) {
      this.zones = this.zonesService.zonesBySize.filter((_, index, allZones) => index < allZones.length - 1);
    }

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
          geometry: new Polygon([this.olMapService.pathToCoordinate(zone.path)]),
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
            width: 1,
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
        width: 4,
      }),
    });
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

  setAll(completed: boolean) {
    this.allComplete = completed;
    if (this.task.subtasks == null) {
      return;
    }
    this.task.subtasks.forEach((t) => (t.completed = completed));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
