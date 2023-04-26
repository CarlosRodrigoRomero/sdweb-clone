import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipInputEvent } from '@angular/material/chips';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { Subscription } from 'rxjs';

import { PlantaService } from '@data/services/planta.service';
import { UserService } from '@data/services/user.service';

import { PlantaInterface } from '@core/models/planta';
import { UserInterface } from '@core/models/user';

@Component({
  selector: 'app-plant-create',
  templateUrl: './plant-create.component.html',
  styleUrls: ['./plant-create.component.css'],
})
export class PlantCreateComponent implements OnInit, OnDestroy {
  form: FormGroup;
  planta: PlantaInterface = {};
  plantCreated = false;
  empresas: UserInterface[];
  empresaSelected: UserInterface;
  nombreGlobalCoords: string[] = [];
  tipo: string;
  vertical = false;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  removable = true;

  private subscriptions = new Subscription();

  constructor(
    private formBuilder: FormBuilder,
    private plantaService: PlantaService,
    private _snackBar: MatSnackBar,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.userService.getAllUsers().subscribe((empresas) => {
        this.empresas = empresas.filter(
          (empresa) =>
            empresa.empresaNombre !== undefined && empresa.empresaNombre !== null && empresa.empresaNombre !== ''
        );
      })
    );

    this.buildForm();
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      nombre: [, [Validators.required]],
      alturaBajaPrimero: [false, [Validators.required]],
      columnaDchaPrimero: [false, [Validators.required]],
      autoLocReady: [false, [Validators.required]],
      filas: [, [Validators.required]],
      columnas: [, [Validators.required]],
      latitud: [, [Validators.required]],
      longitud: [, [Validators.required]],
      zoom: [17, [Validators.required]],
      nombreGlobalCoords: [],
      potencia: [, [Validators.required]],
      tipo: [, [Validators.required]],
      vertical: [false, [Validators.required]],
      stringConectorGlobals: [],
    });
  }

  onSubmit(event: Event) {
    if (this.empresaSelected !== undefined) {
      event.preventDefault();
      if (this.form.valid) {
        this.planta.nombre = this.form.get('nombre').value;
        this.planta.filas = this.form.get('filas').value;
        this.planta.columnas = this.form.get('columnas').value;
        this.planta.longitud = this.form.get('longitud').value;
        this.planta.latitud = this.form.get('latitud').value;
        this.planta.zoom = this.form.get('zoom').value;
        this.planta.nombreGlobalCoords = this.nombreGlobalCoords;
        this.planta.potencia = this.form.get('potencia').value;
        this.planta.tipo = this.tipo;
        this.planta.vertical = this.vertical;
        this.planta.alturaBajaPrimero = this.form.get('alturaBajaPrimero').value;
        this.planta.columnaDchaPrimero = this.form.get('columnaDchaPrimero').value;

        this.planta.autoLocReady = this.form.get('autoLocReady').value;
        this.planta.empresa = this.empresaSelected.uid;

        if (this.form.get('stringConectorGlobals').value !== null) {
          this.planta.stringConectorGlobals = this.form.get('stringConectorGlobals').value;
        }

        // Crea la planta en la DB
        this.plantaService.addPlanta(this.planta);

        // aviso de informe creado correctamente
        this.openSnackBar();

        this.plantCreated = true;
      }
    }
  }

  getElemSelected(element: any) {
    this.empresaSelected = element;
  }

  private openSnackBar() {
    this._snackBar.open('Planta creada correctamente', 'OK', { duration: 5000 });
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our element
    if (value) {
      this.nombreGlobalCoords.push(value);
    }

    // Clear the input value
    event.input.value = '';
  }

  remove(nombre: string): void {
    const index = this.nombreGlobalCoords.indexOf(nombre);

    if (index >= 0) {
      this.nombreGlobalCoords.splice(index, 1);
    }
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.nombreGlobalCoords, event.previousIndex, event.currentIndex);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
