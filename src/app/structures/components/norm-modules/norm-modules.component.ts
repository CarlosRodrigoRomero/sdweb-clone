import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';

import { MatDialog } from '@angular/material/dialog';

import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';

import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import Select from 'ol/interaction/Select';
import { click } from 'ol/events/condition';
import Draw, { createBox } from 'ol/interaction/Draw';
import Overlay from 'ol/Overlay';
import GeometryType from 'ol/geom/GeometryType';

import { OlMapService } from '@core/services/ol-map.service';
import { StructuresService } from '@core/services/structures.service';

import { MatDialogConfirmComponent } from '@shared/components/mat-dialog-confirm/mat-dialog-confirm.component';

import { NormalizedModule } from '@core/models/normalizedModule';

@Component({
  selector: 'app-norm-modules',
  templateUrl: './norm-modules.component.html',
  styleUrls: ['./norm-modules.component.css'],
})
export class NormModulesComponent implements OnInit, OnDestroy {
  private map: Map;
  private normModLayer = new VectorLayer();
  normModSelected: NormalizedModule = undefined;
  editNormModules = false;
  private draw: Draw;
  drawActive = false;
  private popup: Overlay;
  public coordsNewNormMod: any;
  centroidDB: any;
  form: FormGroup;
  modGroupSelectedId: string = undefined;
  imageTif: string;
  modGroupId: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private olMapService: OlMapService,
    private structuresService: StructuresService,
    public dialog: MatDialog,
    private http: HttpClient,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(this.olMapService.map$.subscribe((map) => (this.map = map)));

    this.subscriptions.add(
      this.structuresService.normModSelected$.subscribe((normMod) => (this.normModSelected = normMod))
    );

    this.subscriptions.add(this.structuresService.editNormModules$.subscribe((edit) => (this.editNormModules = edit)));

    this.subscriptions.add(
      this.structuresService.modGroupSelectedId$.subscribe((id) => (this.modGroupSelectedId = id))
    );

    this.buildForm();

    this.subscriptions.add(
      this.structuresService.loadNormModules$.subscribe((load) => {
        if (load) {
          this.createNormModulesLayer();
          this.addNormModules();

          this.addSelectInteraction();

          this.addPopupOverlay();

          this.addClickOutFeatures();
        }

        // aplicamos la visibilidad dependiende de la fase en la que estemos
        this.setNormModulesVisibility(load);
      })
    );
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
      id: 'normModLayer',
    });

    this.map.addLayer(this.normModLayer);
  }

  private addNormModules() {
    const nMSource = this.normModLayer.getSource();

    this.structuresService.allNormModules$.subscribe((normMods) => {
      nMSource.clear();

      normMods.forEach((normMod) => {
        const coords = this.structuresService.coordsDBToCoordinate(normMod.coords);
        const feature = new Feature({
          geometry: new Polygon([coords]),
          properties: {
            id: normMod.id,
            name: 'normModule',
            normMod,
          },
        });

        nMSource.addFeature(feature);
      });
    });
  }

  private setNormModulesVisibility(visible: boolean) {
    if (this.map !== undefined) {
      this.map
        .getLayers()
        .getArray()
        .filter((layer) => layer.getProperties().id !== undefined && layer.getProperties().id === 'normModLayer')
        .forEach((layer) => layer.setVisible(visible));
    }
  }

  private addSelectInteraction() {
    const select = new Select({
      style: this.getNormModStyle(false),
      condition: click,
      layers: (l) => {
        if (this.editNormModules) {
          if (l.getProperties().id === 'normModLayer') {
            return true;
          } else {
            return false;
          }
        }
      },
    });

    this.map.addInteraction(select);
    select.on('select', (e) => {
      if (e.selected.length > 0) {
        this.structuresService.normModSelected = e.selected[0].getProperties().properties.normMod;

        e.selected[0].setStyle(this.getNormModStyle(true));
      }
    });
  }

  private getNormModStyle(focused: boolean) {
    if (focused) {
      return (feature: Feature) => {
        if (feature !== undefined) {
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
        if (feature !== undefined) {
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

  private addClickOutFeatures() {
    this.map.on('click', (event) => {
      const feature = this.map
        .getFeaturesAtPixel(event.pixel)
        .filter((item) => item.getProperties().properties !== undefined);

      if (feature.length === 0) {
        this.structuresService.normModSelected = undefined;
      }
    });
  }

  drawNormModule() {
    this.drawActive = true;

    // quitamos el modulo seleccionado si lo hubiera
    this.structuresService.normModSelected = undefined;

    const sourceNormModule = new VectorSource();
    const style = new Style({
      stroke: new Stroke({
        color: 'rgba(0,0,0,0)',
        width: 1,
      }),
    });

    const vectorNormModule: VectorLayer = this.olMapService.createVectorLayer(sourceNormModule);
    vectorNormModule.setStyle(style);

    this.map.addLayer(vectorNormModule);

    this.draw = new Draw({
      source: sourceNormModule,
      type: GeometryType.CIRCLE,
      geometryFunction: createBox(),
    });
    this.olMapService.draw = this.draw;

    this.map.addInteraction(this.draw);

    this.draw.on('drawend', (evt) => {
      sourceNormModule.clear();

      const polygon = evt.feature.getGeometry() as Polygon;
      const coords = polygon.getCoordinates();

      this.coordsNewNormMod = this.structuresService.coordinateToObject(coords);

      const centroid = this.structuresService.getCentroid(coords[0]);

      this.centroidDB = this.structuresService.prepareCentroidToDB(centroid);

      this.popup.setPosition(coords[0][3]);

      // terminamos el modo draw
      this.map.removeInteraction(this.draw);

      this.drawActive = false;
    });
  }

  cancelDraw() {
    this.drawActive = false;

    this.map.removeInteraction(this.draw);
  }

  confirmDeleteNormModule() {
    const dialogRef = this.dialog.open(MatDialogConfirmComponent, {
      data: 'Se eliminará el módulo de forma permanente. ¿Desea continuar?',
    });

    dialogRef.afterClosed().subscribe((response: boolean) => {
      if (response) {
        this.deleteNormModule();
      }
    });
  }

  deleteNormModule() {
    // lo eliminamos de la DB
    this.structuresService.deleteNormModule(this.normModSelected.id);

    // eliminamos el modulo de la lista de todos los modulos
    this.structuresService.allNormModules = this.structuresService.allNormModules.filter(
      (normMod) => normMod.id !== this.normModSelected.id
    );

    this.structuresService.normModSelected = undefined;
  }

  private addPopupOverlay() {
    const container = document.getElementById('popup');
    this.popup = new Overlay({
      id: 'popup',
      element: container,
      autoPan: true,
      autoPanAnimation: {
        duration: 250,
      },
      position: undefined,
    });

    this.map.addOverlay(this.popup);
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      filas: [1, [Validators.required, Validators.min(1)]],
      columnas: [1, [Validators.required, Validators.min(1)]],
      ventana: [7, [Validators.required, Validators.min(3), Validators.max(10)]],
    });
  }

  autoNormModules(event: Event) {
    event.preventDefault();

    const url = `https://europe-west1-sdweb-d33ce.cloudfunctions.net/estructura`;

    if (this.form.valid) {
      const filas = this.form.get('filas').value;
      const columnas = this.form.get('columnas').value;
      const ventana = this.form.get('ventana').value;

      const params = new HttpParams()
        .set('informeId', this.structuresService.informeId)
        .set('agrupacionId', this.modGroupSelectedId)
        .set('filas', filas.toString())
        .set('columnas', columnas.toString())
        .set('ventana', ventana.toString());

      return this.http
        .get(url, { responseType: 'text', params })
        .toPromise()
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
