import { Component, OnInit } from '@angular/core';

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
import { Layer } from 'ol/layer';

@Component({
  selector: 'app-module-groups',
  templateUrl: './module-groups.component.html',
  styleUrls: ['./module-groups.component.css'],
})
export class ModuleGroupsComponent implements OnInit {
  private vectorGroup: VectorLayer;
  private map: Map;
  private draw: Draw;
  private mGLayer = new VectorLayer();
  mGSelectedId: string;

  constructor(private olMapService: OlMapService, private structuresService: StructuresService) {}

  ngOnInit(): void {
    this.olMapService.map$.subscribe((map) => (this.map = map));

    this.structuresService.loadModuleGroups$.subscribe((load) => {
      if (load) {
        this.createModulesGroupsLayer();
        this.addModuleGroups();

        // this.addPointerOnHover();
        this.addSelectMGInteraction();
      }

      // aplicamos la visibilidad dependiende de la fase en la que estemos
      this.setModuleGroupsVisibility(load);
    });
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

    this.structuresService.getModuleGroups().subscribe((groups) => {
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
    });
  }

  drawGroup() {
    const sourceGroup = new VectorSource();
    const style = new Style({
      stroke: new Stroke({
        color: 'darkblue',
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

    this.map.addInteraction(this.draw);

    this.draw.on('drawend', (evt) => {
      const coords = this.getCoordsRectangle(evt);

      this.structuresService.addModuleGroup(coords);

      // terminamos el modo draw
      this.map.removeInteraction(this.draw);
    });
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

  private addPointerOnHover() {
    this.map.on('pointermove', (event) => {
      if (this.map.hasFeatureAtPixel(event.pixel)) {
        let feature = this.map
          .getFeaturesAtPixel(event.pixel)
          .filter((item) => item.getProperties().properties !== undefined);
        feature = feature.filter((item) => item.getProperties().properties.name === 'moduleGroup');

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

    // select.setProperties({ id: 'selectAnomalia' });

    this.map.addInteraction(select);
    select.on('select', (e) => {
      if (e.selected.length > 0) {
        // guardamos el id para eliminarlo si lo queremos
        this.mGSelectedId = e.selected[0].getProperties().properties.id;
      } else {
        this.mGSelectedId = undefined;
      }
    });
  }

  deleteModuleGroup() {
    this.structuresService.deleteModuleGroup(this.mGSelectedId);
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
}
