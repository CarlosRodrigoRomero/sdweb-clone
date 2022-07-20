import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { TipoSeguidorService } from '@data/services/tipo-seguidor.service';

import { LocationAreaInterface } from '@core/models/location';
import { TipoSeguidor } from '@core/models/tipoSeguidor';
import { MatSelectChange } from '@angular/material/select';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tipo-seguidor-select',
  templateUrl: './tipo-seguidor-select.component.html',
  styleUrls: ['./tipo-seguidor-select.component.css'],
})
export class TipoSeguidorSelectComponent implements OnInit, OnDestroy {
  @Input() selectedLocationArea: LocationAreaInterface;
  @Output() locAreaUpdated = new EventEmitter<LocationAreaInterface>();

  tiposSeguidor: TipoSeguidor[] = [];
  tipoFila = true;
  form: FormGroup;

  private subscriptions: Subscription = new Subscription();

  constructor(private tipoSeguidorService: TipoSeguidorService, private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.tipoSeguidorService.getTiposSeguidor().subscribe((tipos) => (this.tiposSeguidor = tipos))
    );

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
      const nombre = this.getRightName(this.form.value.nombre, this.form.value.tipoFila);
      const tipoSeguidor: TipoSeguidor = {
        nombre,
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

  private getRightName(nombre: string, tipoFila: boolean): string {
    if (tipoFila) {
      return 'fila_' + nombre;
    } else {
      return 'columna_' + nombre;
    }
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

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
