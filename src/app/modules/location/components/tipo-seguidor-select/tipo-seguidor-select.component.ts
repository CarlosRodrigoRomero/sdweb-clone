import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { take } from 'rxjs/operators';

import { TipoSeguidorService } from '@data/services/tipo-seguidor.service';

import { LocationAreaInterface } from '@core/models/location';
import { TipoSeguidor } from '@core/models/tipoSeguidor';
import { MatSelectChange } from '@angular/material/select';

@Component({
  selector: 'app-tipo-seguidor-select',
  templateUrl: './tipo-seguidor-select.component.html',
  styleUrls: ['./tipo-seguidor-select.component.css'],
})
export class TipoSeguidorSelectComponent implements OnInit {
  @Input() selectedLocationArea: LocationAreaInterface;
  @Output() locAreaUpdated = new EventEmitter<LocationAreaInterface>();

  tiposSeguidor: TipoSeguidor[] = [];
  tipoFila = true;
  form: FormGroup;

  constructor(private tipoSeguidorService: TipoSeguidorService, private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.tipoSeguidorService
      .getTiposSeguidor()
      .pipe(take(1))
      .subscribe((tipos) => (this.tiposSeguidor = tipos));

    this.buildForm();
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      tipoFila: [true],
      nombre: [, [Validators.required]],
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form.valid) {
      const tipoSeguidor: TipoSeguidor = {
        nombre: this.form.value.nombre,
        tipoFila: this.form.value.tipoFila,
        numModulos: this.getNumModulos(this.form.value.nombre),
      };

      // Crea la planta en la DB
      this.tipoSeguidorService.addTipoSeguidor(tipoSeguidor);
    }
  }

  private getNumModulos(nombre: string): number[] {
    const numModulos = nombre.split('.').map((num) => Number(num));
    return numModulos;
  }

  updateTipoSeguidor(event: MatSelectChange) {
    this.selectedLocationArea.tipoSeguidor = event.value;
    this.locAreaUpdated.emit(this.selectedLocationArea);
  }

  clearTipoSeguidor(locArea: LocationAreaInterface) {
    delete locArea.tipoSeguidor;

    this.locAreaUpdated.emit(locArea);
  }

  stopPropagation(event) {
    event.stopPropagation();
  }
}
