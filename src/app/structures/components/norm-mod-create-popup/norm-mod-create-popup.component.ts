import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { Map } from 'ol';

import { StructuresService } from '@core/services/structures.service';
import { OlMapService } from '@core/services/ol-map.service';

import { NormalizedModule } from '@core/models/normalizedModule';

@Component({
  selector: 'app-norm-mod-create-popup',
  templateUrl: './norm-mod-create-popup.component.html',
  styleUrls: ['./norm-mod-create-popup.component.css'],
})
export class NormModCreatePopupComponent implements OnInit {
  form: FormGroup;
  private map: Map;
  private initialValues: any;

  @Input() coords: any;

  constructor(
    private formBuilder: FormBuilder,
    private structuresService: StructuresService,
    private olMapService: OlMapService
  ) {}

  ngOnInit(): void {
    this.olMapService.map$.subscribe((map) => (this.map = map));

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
      const normModule: NormalizedModule = {
        fila: this.form.get('fila').value,
        columna: this.form.get('columna').value,
        image_name: this.form.get('image_name').value + '.tif',
        coords: this.coords,
        agrupacionId: this.form.get('agrupacionId').value,
      };

      // Crea el modulos normalizado en la DB
      this.structuresService.addNormModule(normModule);

      // ocultamos el popup
      this.hidePopup();
    }
  }

  hidePopup() {
    // reseteamos el formulario
    this.form.reset(this.initialValues);

    this.map.getOverlayById('popup').setPosition(undefined);
  }
}
