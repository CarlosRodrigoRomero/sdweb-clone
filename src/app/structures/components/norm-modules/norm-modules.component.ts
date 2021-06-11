import { Component, OnInit } from '@angular/core';

import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';

import { OlMapService } from '@core/services/ol-map.service';
import { StructuresService } from '@core/services/structures.service';
import VectorSource from 'ol/source/Vector';
import { Stroke, Style } from 'ol/style';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { Coordinate } from 'ol/coordinate';

@Component({
  selector: 'app-norm-modules',
  templateUrl: './norm-modules.component.html',
  styleUrls: ['./norm-modules.component.css'],
})
export class NormModulesComponent implements OnInit {
  private map: Map;
  private normModLayer = new VectorLayer();

  constructor(private olMapService: OlMapService, private structuresService: StructuresService) {}

  ngOnInit(): void {
    this.olMapService.map$.subscribe((map) => (this.map = map));

    this.structuresService.loadNormModules$.subscribe((load) => {
      if (load) {
        this.createNormModulesLayer();
        this.addNormModules();

        this.addPointerOnHover();
      }

      // aplicamos la visibilidad dependiende de la fase en la que estemos
      this.setNormModulesVisibility(load);
    });
  }

  private createNormModulesLayer() {
    this.normModLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: new Style({
        stroke: new Stroke({
          color: 'white',
          width: 2,
        }),
      }),
    });

    this.normModLayer.setProperties({
      id: 'nMLayer',
    });

    this.map.addLayer(this.normModLayer);
  }

  private addNormModules() {
    const nMSource = this.normModLayer.getSource();

    this.structuresService.getNormModules().subscribe((normMods) => {
      nMSource.clear();

      normMods.forEach((normMod) => {
        const coords = this.objectToCoordinate(normMod.coords);
        const feature = new Feature({
          geometry: new Polygon([coords]),
          properties: {
            id: normMod.id,
            name: 'normModule',
          },
        });

        nMSource.addFeature(feature);
      });
    });
  }

  private objectToCoordinate(coords: any) {
    const coordsOK: Coordinate[] = [
      [coords.topLeft.long, coords.topLeft.lat],
      [coords.topRight.long, coords.topRight.lat],
      [coords.bottomRight.long, coords.bottomRight.lat],
      [coords.bottomLeft.long, coords.bottomLeft.lat],
    ];

    return coordsOK;
  }

  private addPointerOnHover() {
    this.map.on('pointermove', (event) => {
      if (this.map.hasFeatureAtPixel(event.pixel)) {
        let feature = this.map
          .getFeaturesAtPixel(event.pixel)
          .filter((item) => item.getProperties().properties !== undefined);
        feature = feature.filter((item) => item.getProperties().properties.name === 'normModule');

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

  private setNormModulesVisibility(visible: boolean) {
    if (this.map !== undefined) {
      this.map
        .getLayers()
        .getArray()
        .filter((layer) => layer.getProperties().id !== undefined && layer.getProperties().id === 'nMLayer')
        .forEach((layer) => layer.setVisible(visible));
    }
  }
}
