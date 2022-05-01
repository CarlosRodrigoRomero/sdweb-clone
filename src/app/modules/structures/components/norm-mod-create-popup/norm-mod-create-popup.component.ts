import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Subscription } from 'rxjs';

import { Map } from 'ol';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';

import { StructuresService } from '@data/services/structures.service';
import { OlMapService } from '@data/services/ol-map.service';

import { NormalizedModule } from '@core/models/normalizedModule';

@Component({
  selector: 'app-norm-mod-create-popup',
  templateUrl: './norm-mod-create-popup.component.html',
  styleUrls: ['./norm-mod-create-popup.component.css'],
})
export class NormModCreatePopupComponent implements OnInit, OnChanges, OnDestroy {
  form: FormGroup;
  private map: Map;
  private initialValues: any;
  normModSelected: NormalizedModule;

  private subscriptions: Subscription = new Subscription();

  @Input() coords: any;
  @Input() centroid: any;
  @Input() imageTif: string;
  @Input() modGroupId: string;

  constructor(
    private formBuilder: FormBuilder,
    private structuresService: StructuresService,
    private olMapService: OlMapService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(this.olMapService.map$.subscribe((map) => (this.map = map)));

    this.subscriptions.add(
      this.structuresService.normModSelected$.subscribe((normMod) => {
        this.normModSelected = normMod;

        if (normMod !== undefined) {
          this.form.patchValue({
            fila: normMod.fila,
            columna: normMod.columna,
            image_name: normMod.image_name.replace('.tif', ''),
            agrupacionId: normMod.agrupacionId,
          });
        }
      })
    );

    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.form !== undefined) {
      this.form.patchValue({ image_name: this.imageTif, agrupacionId: this.modGroupId });
    }
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      fila: [1, [Validators.required, Validators.min(1)]],
      columna: [1, [Validators.required, Validators.min(1)]],
      image_name: [, [Validators.required]],
      agrupacionId: [, [Validators.required]],
    });

    // guardamos los valores iniciales
    this.initialValues = this.form.value;
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form.valid) {
      if (this.normModSelected === undefined) {
        this.addNormModule();
      } else {
        this.updateNormModule();
      }

      // ocultamos el popup
      this.hidePopup();
    }
  }

  private addNormModule() {
    const id = this.structuresService.generateRandomId();

    const normModule: NormalizedModule = {
      id,
      fila: this.form.get('fila').value,
      columna: this.form.get('columna').value,
      image_name: this.form.get('image_name').value + '.tif',
      coords: this.coords,
      agrupacionId: this.form.get('agrupacionId').value,
      centroid_gps: this.centroid,
    };

    // Crea el modulos normalizado en la DB
    this.structuresService.addNormModule(normModule);

    // añadimos el nuevo modulo como feature
    this.addNormModFeature(normModule);
  }

  private updateNormModule() {
    const id = this.normModSelected.id;

    const normModule: NormalizedModule = {
      id,
      fila: this.form.get('fila').value,
      columna: this.form.get('columna').value,
      image_name: this.form.get('image_name').value + '.tif',
      coords: this.normModSelected.coords,
      agrupacionId: this.form.get('agrupacionId').value,
      centroid_gps: this.normModSelected.centroid_gps,
    };

    // actualizamos el modulo normalizado en la DB
    this.structuresService.updateNormModule(normModule);

    // actualizamos la feature del modulo
    this.updateNormModFeature(normModule);
  }

  private addNormModFeature(normModule: NormalizedModule) {
    let normModLayer;
    this.map.getLayers().forEach((layer) => {
      if (layer.getProperties().id === 'normModLayer') {
        normModLayer = layer;
      }
    });

    const mBSource = normModLayer.getSource();

    const coords = this.structuresService.coordsDBToCoordinate(normModule.coords);
    const feature = new Feature({
      geometry: new Polygon([coords]),
      properties: {
        id: normModule.id,
        name: 'normModule',
        normMod: normModule,
        visible: true,
      },
    });

    mBSource.addFeature(feature);
  }

  private updateNormModFeature(normModule: NormalizedModule) {
    let normModLayer;
    this.map.getLayers().forEach((layer) => {
      if (layer.getProperties().id === 'normModLayer') {
        normModLayer = layer;
      }
    });

    const mBSource = normModLayer.getSource();

    const features = mBSource.getFeatures().filter((f) => f.getProperties().properties.id !== normModule.id);

    mBSource.clear();

    mBSource.addFeatures(features);

    const coords = this.structuresService.coordsDBToCoordinate(normModule.coords);
    const feature = new Feature({
      geometry: new Polygon([coords]),
      properties: {
        id: normModule.id,
        name: 'normModule',
        normMod: normModule,
        visible: true,
      },
    });

    mBSource.addFeature(feature);
  }

  hidePopup() {
    // reseteamos el formulario
    this.form.reset(this.initialValues);

    this.structuresService.normModSelected = undefined;

    this.map.getOverlayById('popup').setPosition(undefined);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
