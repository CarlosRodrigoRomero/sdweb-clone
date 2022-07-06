import { Component, OnDestroy, OnInit } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import { switchMap, take } from 'rxjs/operators';
import { from, Subscription } from 'rxjs';

import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import Draw, { createBox } from 'ol/interaction/Draw';
import GeometryType from 'ol/geom/GeometryType';
import Polygon from 'ol/geom/Polygon';
import Feature, { FeatureLike } from 'ol/Feature';

import { StructuresService } from '@data/services/structures.service';
import { OlMapService } from '@data/services/ol-map.service';
import { FilterService } from '@data/services/filter.service';

import { RawModule } from '@core/models/moduloBruto';

import { MatDialogConfirmComponent } from '@shared/components/mat-dialog-confirm/mat-dialog-confirm.component';
import { Select } from 'ol/interaction';
import { click } from 'ol/events/condition';

@Component({
  selector: 'app-raw-modules',
  templateUrl: './raw-modules.component.html',
  styleUrls: ['./raw-modules.component.css'],
})
export class RawModulesComponent implements OnInit, OnDestroy {
  private map: Map;
  private vectorRawModule: VectorLayer;
  private draw: Draw;
  deleteMode = false;
  createMode = false;
  private rawModDeletedIds: string[] = [];
  private rawModLayer: VectorLayer;
  private rawMods: RawModule[];
  private prevFeatureHover: Feature;
  public rawModHovered: RawModule;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private structuresService: StructuresService,
    private olMapService: OlMapService,
    public dialog: MatDialog,
    private filterService: FilterService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.olMapService.map$.subscribe((map) => {
        this.map = map;

        if (this.map !== undefined) {
          this.createRawModulesLayer();
          this.addRawModules();

          this.addPointerOnHover();
          this.addOnHoverRawModuleAction();
          this.addSelectRawModuleInteraction();
        }
      })
    );

    this.subscriptions.add(
      this.structuresService.createRawModMode$.subscribe((mode) => {
        this.createMode = mode;

        if (this.createMode) {
          this.drawRawModules();
        } else if (this.draw !== undefined) {
          // terminamos el modo draw
          this.map.removeInteraction(this.draw);
        }
      })
    );

    this.subscriptions.add(this.structuresService.deleteRawModMode$.subscribe((mode) => (this.deleteMode = mode)));

    this.subscriptions.add(this.structuresService.deletedRawModIds$.subscribe((ids) => (this.rawModDeletedIds = ids)));

    this.subscriptions.add(
      this.structuresService.loadRawModules$.subscribe((load) => this.setRawModulesVisibility(load))
    );
  }

  private createRawModulesLayer() {
    this.rawModLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: new Style({
        stroke: new Stroke({
          width: 2,
          color: 'white',
        }),
      }),
    });

    this.rawModLayer.setProperties({
      id: 'rawModLayer',
    });

    this.map.addLayer(this.rawModLayer);
  }

  private addRawModules() {
    const rawModSource = this.rawModLayer.getSource();

    this.subscriptions.add(
      this.structuresService.allRawModules$
        .pipe(
          switchMap((rawMods) => from(this.filterService.initService(rawMods))),
          switchMap(() => this.structuresService.getFiltersParams()),
          switchMap((filtParams) => {
            if (filtParams.length > 0) {
              this.structuresService.applyFilters(filtParams);

              this.structuresService.deletedRawModIds = filtParams[0].eliminados;
            }

            return this.filterService.filteredElements$;
          })
        )
        .subscribe((elems) => {
          rawModSource.clear();

          if (this.rawModDeletedIds !== undefined && this.rawModDeletedIds.length > 0) {
            this.rawMods = (elems as RawModule[]).filter((mB) => !this.rawModDeletedIds.includes(mB.id));
          } else {
            this.rawMods = elems as RawModule[];
          }

          if (this.rawMods.length > 0) {
            // actualizamos las medias y desviaciones estandar con los modulos filtrados
            this.structuresService.updateAveragesAndStandardDeviations(this.rawMods);

            // asignamos el numero de modulos del informe
            this.setReportNumModules();

            this.rawMods.forEach((rawMod, index) => {
              this.addRawModule(rawMod);
            });
          }
        })
    );
  }

  private setReportNumModules() {
    const allRawModules = this.structuresService.allRawModules;
    if (this.rawModDeletedIds !== undefined && this.rawModDeletedIds.length > 0) {
      this.structuresService.reportNumModules = allRawModules.filter(
        (mod) => !this.rawModDeletedIds.includes(mod.id)
      ).length;
    } else {
      this.structuresService.reportNumModules = allRawModules.length;
    }
  }

  private addRawModule(rawMod: RawModule) {
    const mBSource = this.rawModLayer.getSource();
    const feature = new Feature({
      geometry: new Polygon([rawMod.coords]),
      properties: {
        id: rawMod.id,
        name: 'rawMod',
        visible: true,
      },
    });

    mBSource.addFeature(feature);
  }

  private addPointerOnHover() {
    this.map.on('pointermove', (event) => {
      if (this.map.hasFeatureAtPixel(event.pixel)) {
        // con trolamos todos los pointerOnHover desde aquí para que no tengan interferencias entre ellos
        const features: FeatureLike[] = [];

        if (this.deleteMode) {
          let featuresMB = this.map
            .getFeaturesAtPixel(event.pixel)
            .filter((item) => item.getProperties().properties !== undefined);
          featuresMB = featuresMB.filter((item) => item.getProperties().properties.name === 'rawMod');

          features.push(...featuresMB);
        }

        let featuresMG = this.map
          .getFeaturesAtPixel(event.pixel)
          .filter((item) => item.getProperties().properties !== undefined);
        featuresMG = featuresMG.filter((item) => item.getProperties().properties.name === 'moduleGroup');

        features.push(...featuresMG);

        if (this.structuresService.editNormModules) {
          let featuresNM = this.map
            .getFeaturesAtPixel(event.pixel)
            .filter((item) => item.getProperties().properties !== undefined);
          featuresNM = featuresNM.filter((item) => item.getProperties().properties.name === 'normModule');

          features.push(...featuresNM);
        }

        if (features.length > 0) {
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

  private addOnHoverRawModuleAction() {
    let currentFeatureHover: Feature;
    this.map.on('pointermove', (event) => {
      if (this.map.hasFeatureAtPixel(event.pixel)) {
        if (this.deleteMode) {
          const feature: Feature = this.map
            .getFeaturesAtPixel(event.pixel)
            .filter((item) => item.getProperties().properties !== undefined)
            .filter((item) => item.getProperties().properties.name === 'rawMod')[0] as Feature;

          if (feature !== undefined) {
            // cuando pasamos de un modulo a otro directamente sin pasar por vacio
            if (this.prevFeatureHover !== undefined && this.prevFeatureHover !== feature) {
              // quitamos el efecto resaltado
              this.prevFeatureHover.setStyle(this.getStyleRawMod(false));
              this.prevFeatureHover = undefined;
            }
            currentFeatureHover = feature;

            this.rawModHovered = this.rawMods.find((rawMod) => rawMod.id === feature.getProperties().properties.id);

            // aplicamos el efecto resaltado
            feature.setStyle(this.getStyleRawMod(true));

            this.prevFeatureHover = feature;
          }
        } else {
          const feature: Feature = this.map
            .getFeaturesAtPixel(event.pixel)
            .filter((item) => item.getProperties().properties !== undefined)
            .filter((item) => item.getProperties().properties.name === 'rawMod')[0] as Feature;

          if (feature !== undefined) {
            this.rawModHovered = this.rawMods.find((rawMod) => rawMod.id === feature.getProperties().properties.id);
          }
        }
      } else {
        this.rawModHovered = undefined;
        if (currentFeatureHover !== undefined) {
          // quitamos el efecto resaltado
          currentFeatureHover.setStyle(this.getStyleRawMod(false));
          currentFeatureHover = undefined;
        }
      }
    });
  }

  private addSelectRawModuleInteraction() {
    const select = new Select({
      style: new Style({
        fill: new Fill({
          color: 'rgba(0,0,0,0)',
        }),
      }),
      condition: click,
      layers: (l) => {
        if (this.deleteMode) {
          if (l.getProperties().id === 'rawModLayer') {
            return true;
          } else {
            return false;
          }
        }
      },
    });

    this.map.addInteraction(select);

    select.on('select', (e) => {
      if (this.deleteMode) {
        if (e.selected.length > 0) {
          if (e.selected[0].getProperties().properties.name === 'rawMod') {
            if (this.rawModDeletedIds !== undefined) {
              this.structuresService.deletedRawModIds = this.rawModDeletedIds.concat(
                e.selected[0].getProperties().properties.id
              );
            } else {
              this.structuresService.deletedRawModIds = [e.selected[0].getProperties().properties.id];
            }
            // dejamos de mostrar el modulo
            e.selected[0].getProperties().properties.visible = false;

            // añadimos el id del modulo eliminado a la DB
            this.structuresService.addFilter('eliminados', this.rawModDeletedIds);

            // quitamos el modulo de la lista de modulos filtrados
            this.filterService.filteredElements = this.filterService.filteredElements.filter(
              (elem) => elem.id !== e.selected[0].getProperties().properties.id
            );
          }
        }
      }
    });
  }

  private getStyleRawMod(hovered: boolean) {
    if (hovered) {
      return (feature: Feature) => {
        if (feature !== undefined && feature.getProperties().properties.visible === true) {
          return new Style({
            stroke: new Stroke({
              color: 'red',
              width: 4,
            }),
          });
        }
      };
    } else {
      return (feature: Feature) => {
        if (feature !== undefined && feature.getProperties().properties.visible === true) {
          return new Style({
            stroke: new Stroke({
              color: 'white',
              width: 2,
            }),
          });
        }
      };
    }
  }

  switchCreateMode() {
    this.structuresService.createRawModMode = !this.structuresService.createRawModMode;
  }

  switchDeleteMode() {
    this.structuresService.deleteRawModMode = !this.structuresService.deleteRawModMode;
  }

  confirmRestoreDeletedDialog() {
    const dialogRef = this.dialog.open(MatDialogConfirmComponent, {
      data: 'Se restaurarán todos los módulos eliminados manualmente. ¿Desea continuar?',
    });

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((response: boolean) => {
        if (response) {
          this.restoreDeletedModules();
        }
      });
  }

  drawRawModules() {
    const sourceRawModule = new VectorSource();
    const style = new Style({
      stroke: new Stroke({
        color: 'white',
        width: 2,
      }),
    });

    this.vectorRawModule = this.olMapService.createVectorLayer(sourceRawModule);
    this.vectorRawModule.setStyle(style);

    this.map.addLayer(this.vectorRawModule);

    this.draw = new Draw({
      source: sourceRawModule,
      type: GeometryType.CIRCLE,
      geometryFunction: createBox(),
    });
    this.olMapService.draw = this.draw;

    this.map.addInteraction(this.draw);

    this.draw.on('drawend', (evt) => {
      const polygon = evt.feature.getGeometry() as Polygon;
      const coords = polygon.getCoordinates();
      coords[0].pop(); // quitamos el ultimo punto que es igual al primero
      const centroid = this.olMapService.getCentroid(coords[0]);

      const rawModule: RawModule = {
        coords: coords[0],
        area: this.structuresService.areaAverage,
        aspectRatio: this.structuresService.aspectRatioAverage,
        confianza: this.structuresService.confianzaAverage,
        centroid_gps_long: centroid[0],
        centroid_gps_lat: centroid[1],
      };

      // añadimos el nuevo modulo a la DB
      this.structuresService.addRawModule(rawModule);

      // this.filterService.filteredElements.push(rawModule);

      // añadimos el nuevo modulo como feature
      this.addRawModFeature(rawModule);
    });
  }

  cancelDraw() {
    this.createMode = false;

    this.map.removeInteraction(this.draw);
  }

  private addRawModFeature(rawModule: RawModule) {
    let rawModLayer;
    this.map.getLayers().forEach((layer) => {
      if (layer.getProperties().id === 'rawModLayer') {
        rawModLayer = layer;
      }
    });

    const coords = Object.values(rawModule.coords); // lo convertimos en un array

    const mBSource = rawModLayer.getSource();
    const feature = new Feature({
      geometry: new Polygon([coords]),
      properties: {
        id: rawModule.id,
        name: 'rawMod',
        visible: true,
      },
    });

    mBSource.addFeature(feature);
  }

  undoCreatedModule() {
    const lastModule = this.filterService.filteredElements.pop();

    if (this.rawModDeletedIds !== undefined) {
      this.structuresService.deletedRawModIds = this.rawModDeletedIds.concat(lastModule.id);
    } else {
      this.structuresService.deletedRawModIds = [lastModule.id];
    }

    // añadimos el id del modulo eliminado a la DB
    this.structuresService.addFilter('eliminados', this.rawModDeletedIds);
  }

  restoreLastDeletedModule() {
    let deletedIds: string[] = [];
    if (this.structuresService.deletedRawModIds !== undefined) {
      this.structuresService.deletedRawModIds.pop();
    }
    deletedIds = this.structuresService.deletedRawModIds;

    if (deletedIds !== undefined) {
      if (deletedIds.length > 0) {
        this.structuresService.addFilter('eliminados', deletedIds);
      } else {
        this.structuresService.deleteFilter('eliminados');
      }
    }

    this.filterService.processFilters();
  }

  restoreDeletedModules() {
    // eliminamos el array aliminados de la DB
    this.structuresService.deleteFilter('eliminados');

    // vaciamos el array local con los eliminados
    this.structuresService.deletedRawModIds = [];

    this.filterService.processFilters();
  }

  private setRawModulesVisibility(visible: boolean) {
    if (this.map !== undefined) {
      this.map
        .getLayers()
        .getArray()
        .filter((layer) => layer.getProperties().id !== undefined && layer.getProperties().id === 'rawModLayer')
        .forEach((layer) => layer.setVisible(visible));
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
