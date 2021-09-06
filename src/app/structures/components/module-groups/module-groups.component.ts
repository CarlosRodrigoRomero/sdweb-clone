import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { MatDialog } from '@angular/material/dialog';

import { AngularFirestore } from '@angular/fire/firestore';

import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import { Stroke, Style } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import Draw, { createBox, DrawEvent } from 'ol/interaction/Draw';
import GeometryType from 'ol/geom/GeometryType';
import { Coordinate } from 'ol/coordinate';
import Polygon from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import { Select } from 'ol/interaction';
import { click } from 'ol/events/condition';

import { OlMapService } from '@core/services/ol-map.service';
import { StructuresService } from '@core/services/structures.service';

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
  private mGLayer = new VectorLayer();
  modGroupSelectedId: string;
  drawActive = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private olMapService: OlMapService,
    private structuresService: StructuresService,
    public dialog: MatDialog,
    public afs: AngularFirestore
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
    this.mGLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: new Style({
        stroke: new Stroke({
          color: 'darkblue',
          width: 2,
        }),
      }),
    });

    this.mGLayer.setProperties({
      id: 'mGLayer',
    });

    this.map.addLayer(this.mGLayer);
  }

  private addModuleGroups() {
    const mGSource = this.mGLayer.getSource();

    this.subscriptions.add(
      this.structuresService.allModGroups$.subscribe((groups) => {
        mGSource.clear();

        groups.forEach((mG) => {
          const feature = new Feature({
            geometry: new Polygon([this.getAllCoordsRectangle(mG.coords)]),
            properties: {
              id: mG.id,
              name: 'moduleGroup',
            },
          });

          this.getAllCoordsRectangle(mG.coords);

          mGSource.addFeature(feature);
        });
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
      // type: GeometryType.POLYGON,
      type: GeometryType.CIRCLE,
      geometryFunction: createBox(),
    });
    this.olMapService.draw = this.draw;

    this.map.addInteraction(this.draw);

    this.draw.on('drawend', (evt) => {
      sourceGroup.clear();

      // obtenemos un ID aleatorio
      const id = this.afs.createId();

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

  cancelDraw() {
    this.structuresService.drawModGroups = false;

    this.map.removeInteraction(this.draw);
  }

  getCoordsRectangle(event: DrawEvent): Coordinate[] {
    const polygon = event.feature.getGeometry() as Polygon;
    const coords = polygon.getCoordinates();

    return [coords[0][1], coords[0][3]];
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

    dialogRef.afterClosed().subscribe((response: boolean) => {
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
