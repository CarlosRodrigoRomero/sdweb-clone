import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Subscription } from 'rxjs';

import { Map } from 'ol';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';

import { StructuresService } from '@core/services/structures.service';
import { OlMapService } from '@core/services/ol-map.service';

import { NormalizedModule } from '@core/models/normalizedModule';

@Component({
  selector: 'app-norm-mod-create-popup',
  templateUrl: './norm-mod-create-popup.component.html',
  styleUrls: ['./norm-mod-create-popup.component.css'],
})
export class NormModCreatePopupComponent implements OnInit, OnDestroy {
  form: FormGroup;
  private map: Map;
  private initialValues: any;

  private subscriptions: Subscription = new Subscription();

  @Input() coords: any;
  @Input() centroid: any;

  constructor(
    private formBuilder: FormBuilder,
    private structuresService: StructuresService,
    private olMapService: OlMapService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(this.olMapService.map$.subscribe((map) => (this.map = map)));

    this.buildForm();
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

      // ocultamos el popup
      this.hidePopup();
    }
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

  hidePopup() {
    // reseteamos el formulario
    this.form.reset(this.initialValues);

    this.map.getOverlayById('popup').setPosition(undefined);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
