import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { MatDialog } from '@angular/material/dialog';

import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import { Stroke, Style } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import Draw, { createBox, DrawEvent } from 'ol/interaction/Draw';
import GeometryType from 'ol/geom/GeometryType';
import { Coordinate } from 'ol/coordinate';
import Polygon from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import { DoubleClickZoom, Select } from 'ol/interaction';
import { click } from 'ol/events/condition';

import { OlMapService } from '@data/services/ol-map.service';
import { StructuresService } from '@data/services/structures.service';

import { MatDialogConfirmComponent } from '@shared/components/mat-dialog-confirm/mat-dialog-confirm.component';
import { ModuleGroup } from '@core/models/moduleGroup';

@Component({
  selector: 'app-module-groups',
  templateUrl: './module-groups.component.html',
  styleUrls: ['./module-groups.component.css'],
})
export class ModuleGroupsComponent implements OnInit, OnDestroy {
  private vectorGroup: VectorLayer;
  private map: Map;
  private draw: Draw;
  private mGLayer: VectorLayer;
  modGroupSelectedId: string;
  drawActive = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private olMapService: OlMapService,
    private structuresService: StructuresService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.olMapService.map$.subscribe((map) => {
        this.map = map;

        if (this.map !== undefined) {
          this.createModulesGroupsLayer();
          this.addModuleGroups();

          this.addSelectMGInteraction();
        }
      })
    );

    this.subscriptions.add(
      this.structuresService.modGroupSelectedId$.subscribe((id) => (this.modGroupSelectedId = id))
    );

    this.subscriptions.add(this.structuresService.drawModGroups$.subscribe((value) => (this.drawActive = value)));
  }

  private createModulesGroupsLayer() {
    // si no existe previamente la creamos
    if (this.mGLayer === undefined) {
      this.mGLayer = new VectorLayer({
        source: new VectorSource({ wrapX: false }),
        style: new Style({
          stroke: new Stroke({
            color: 'green',
            width: 4,
          }),
        }),
      });

      this.mGLayer.setProperties({
        id: 'mGLayer',
      });

      this.map.addLayer(this.mGLayer);
    }
  }

  private addModuleGroups() {
    this.subscriptions.add(
      this.structuresService.allModGroups$.subscribe((groups) => {
        if (this.mGLayer !== undefined) {
          const mGSource = this.mGLayer.getSource();
          mGSource.clear();

          groups.forEach((mG) => {
            let coords = mG.coords;

            if (coords.length <= 2 || coords[2] === undefined) {
              coords = this.getAllCoordsRectangle(mG.coords);
            }

            const feature = new Feature({
              geometry: new Polygon([coords]),
              properties: {
                id: mG.id,
                name: 'moduleGroup',
              },
            });

            this.getAllCoordsRectangle(mG.coords);

            mGSource.addFeature(feature);
          });
        }
      })
    );
  }

  drawGroup() {
    this.structuresService.drawModGroups = true;

    const sourceGroup = new VectorSource();
    const style = new Style({
      stroke: new Stroke({
        color: 'rgba(0,0,0,0)',
        width: 2,
      }),
    });

    this.vectorGroup = this.olMapService.createVectorLayer(sourceGroup);
    this.vectorGroup.setStyle(style);

    this.map.addLayer(this.vectorGroup);

    this.draw = new Draw({
      source: sourceGroup,
      type: GeometryType.CIRCLE,
      geometryFunction: createBox(),
    });

    this.olMapService.draw = this.draw;

    this.map.addInteraction(this.draw);

    this.draw.on('drawend', (evt) => {
      // desactivamos el dobleclick para que no interfiera al cerrar poligono
      this.map.getInteractions().forEach((interaction) => {
        if (interaction instanceof DoubleClickZoom) {
          this.map.removeInteraction(interaction);
        }
      });

      sourceGroup.clear();

      // obtenemos un ID aleatorio
      const id = this.structuresService.generateRandomId();

      const coords = this.getCoordsRectangle(evt);

      const modGroup: ModuleGroup = {
        id,
        coords,
      };

      // lo añadimos a la DB
      this.structuresService.addModuleGroup(modGroup);

      // lo añadimos a la lista de agrupaciones
      this.structuresService.allModGroups = [...this.structuresService.allModGroups, modGroup];

      // terminamos el modo draw
      this.map.removeInteraction(this.draw);

      // cambiamos el boton
      this.structuresService.drawModGroups = false;
    });
  }

  drawIrregularGroup() {
    this.structuresService.drawModGroups = true;

    const sourceGroup = new VectorSource();
    const style = new Style({
      stroke: new Stroke({
        color: 'rgba(0,0,0,0)',
        width: 2,
      }),
    });

    this.vectorGroup = this.olMapService.createVectorLayer(sourceGroup);
    this.vectorGroup.setStyle(style);

    this.map.addLayer(this.vectorGroup);

    this.draw = new Draw({
      source: sourceGroup,
      type: GeometryType.POLYGON,
    });

    this.olMapService.draw = this.draw;

    this.map.addInteraction(this.draw);

    this.draw.on('drawend', (evt) => {
      // desactivamos el dobleclick para que no interfiera al cerrar poligono
      this.map.getInteractions().forEach((interaction) => {
        if (interaction instanceof DoubleClickZoom) {
          this.map.removeInteraction(interaction);
        }
      });

      sourceGroup.clear();

      // obtenemos un ID aleatorio
      const id = this.structuresService.generateRandomId();

      const coords = this.getCoordsPolygon(evt);

      coords.pop();

      const modGroup: ModuleGroup = {
        id,
        coords,
      };

      // lo añadimos a la lista de agrupaciones
      this.structuresService.allModGroups = [...this.structuresService.allModGroups, modGroup];

      // this.prepareIrregularCoordsToDB(modGroup);

      // lo añadimos a la DB
      this.structuresService.addModuleGroup(modGroup);

      // terminamos el modo draw
      this.map.removeInteraction(this.draw);

      // cambiamos el boton
      this.structuresService.drawModGroups = false;
    });
  }

  private prepareIrregularCoordsToDB(modGroup: ModuleGroup) {
    const coords: Coordinate[] = [];
    modGroup.coords.forEach((coord, index) => {
      if (index < 4) {
        coords.push(coord);
      }
    });

    coords.sort((a, b) => a[0] - b[0]);

    const lefts = [coords[0], coords[1]];
    const rights = [coords[2], coords[3]];

    let topLeft = lefts[0];
    let bottomLeft = lefts[1];
    if (topLeft[1] < bottomLeft[1]) {
      topLeft = lefts[1];
      bottomLeft = lefts[0];
    }
    let topRight = rights[0];
    let bottomRight = rights[1];
    if (topRight[1] < bottomRight[1]) {
      topRight = rights[1];
      bottomRight = rights[0];
    }

    return { topLeft, topRight, bottomRight, bottomLeft };
  }

  cancelDraw() {
    this.structuresService.drawModGroups = false;

    this.map.removeInteraction(this.draw);
  }

  getCoordsRectangle(event: DrawEvent): Coordinate[] {
    const polygon = event.feature.getGeometry() as Polygon;
    const coords = polygon.getCoordinates();

    return [coords[0][1], coords[0][3]];
  }

  getCoordsPolygon(event: DrawEvent): Coordinate[] {
    const polygon = event.feature.getGeometry() as Polygon;
    const coords = polygon.getCoordinates();

    return coords[0];
  }

  getAllCoordsRectangle(coords: Coordinate[]) {
    const allCoords: Coordinate[] = [];
    allCoords.push(coords[0]);
    allCoords.push([coords[0][0], coords[1][1]]);
    allCoords.push(coords[1]);
    allCoords.push([coords[1][0], coords[0][1]]);

    return allCoords;
  }

  private addSelectMGInteraction() {
    const select = new Select({
      style: new Style({
        stroke: new Stroke({
          color: 'white',
          width: 4,
        }),
      }),
      condition: click,
      layers: (l) => {
        if (l.getProperties().id === 'mGLayer') {
          return true;
        } else {
          return false;
        }
      },
    });

    this.map.addInteraction(select);
    select.on('select', (e) => {
      if (e.selected.length > 0) {
        this.structuresService.modGroupSelectedId = e.selected[0].getProperties().properties.id;
      } else {
        this.structuresService.modGroupSelectedId = undefined;
      }
    });
  }

  confirmDeleteModGroup() {
    const dialogRef = this.dialog.open(MatDialogConfirmComponent, {
      data: 'Esto también eliminará los modulos normalizados asociados a esta agrupación. ¿Desea continuar?',
    });

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((response: boolean) => {
        if (response) {
          this.deleteModuleGroup();
        }
      });
  }

  deleteModuleGroup() {
    // eliminamos la agrupacion de la DB
    this.structuresService.deleteModuleGroup(this.modGroupSelectedId);

    // eliminamos tambien los modulos normalizados pertenecientes a la agrupacion
    this.structuresService.deleteNormModulesByGroup(this.modGroupSelectedId);

    // eliminarmos la agrupacion de la lista de agrupaciones
    this.structuresService.allModGroups = this.structuresService.allModGroups.filter(
      (modGroup) => modGroup.id !== this.modGroupSelectedId
    );

    this.structuresService.modGroupSelectedId = undefined;
  }

  private setModuleGroupsVisibility(visible: boolean) {
    if (this.map !== undefined) {
      this.map
        .getLayers()
        .getArray()
        .filter((layer) => layer.getProperties().id !== undefined && layer.getProperties().id === 'mGLayer')
        .forEach((layer) => layer.setVisible(visible));
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
