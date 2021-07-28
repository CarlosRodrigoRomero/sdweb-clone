import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipInputEvent } from '@angular/material/chips';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { take } from 'rxjs/operators';

import Map from 'ol/Map';
import XYZ from 'ol/source/XYZ';
import { Tile as TileLayer } from 'ol/layer';
import { View } from 'ol';

import { PlantaService } from '@core/services/planta.service';
import { AdminService } from '@core/services/admin.service';

import { PlantaInterface } from '@core/models/planta';
import { UserInterface } from '@core/models/user';
import { fromLonLat } from 'ol/proj';

@Component({
  selector: 'app-plant-create',
  templateUrl: './plant-create.component.html',
  styleUrls: ['./plant-create.component.css'],
})
export class PlantCreateComponent implements OnInit {
  form: FormGroup;
  planta: PlantaInterface = {};
  plantCreated = false;
  empresas: UserInterface[];
  empresaSelected: UserInterface;
  private map: Map;
  zoom = 5.65;
  latitud = 40;
  longitud = -4.4;
  nombreGlobalCoords: string[] = [];
  tipo: string;
  vertical = false;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  removable = true;

  constructor(
    private formBuilder: FormBuilder,
    private plantaService: PlantaService,
    private _snackBar: MatSnackBar,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.adminService
      .getAllUsers()
      .pipe(take(1))
      .subscribe((empresas) => {
        this.empresas = empresas.filter(
          (empresa) =>
            empresa.empresaNombre !== undefined && empresa.empresaNombre !== null && empresa.empresaNombre !== ''
        );
      });

    this.initMap();

    this.buildForm();
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      nombre: [, [Validators.required]],
      alturaBajaPrimero: [false, [Validators.required]],
      autoLocReady: [false, [Validators.required]],
      filas: [1, [Validators.required]],
      columnas: [1, [Validators.required]],
      latitud: [, [Validators.required]],
      longitud: [, [Validators.required]],
      zoom: [, [Validators.required]],
      nombreGlobalCoords: [],
      potencia: [, [Validators.required]],
      tipo: [, [Validators.required]],
      vertical: [false, [Validators.required]],
    });
  }

  onSubmit(event: Event) {
    if (this.empresaSelected !== undefined) {
      event.preventDefault();
      if (this.form.valid) {
        this.planta.nombre = this.form.get('nombre').value;
        this.planta.filas = this.form.get('filas').value;
        this.planta.columnas = this.form.get('columnas').value;
        this.planta.longitud = this.longitud;
        this.planta.latitud = this.latitud;
        this.planta.zoom = this.zoom;
        this.planta.nombreGlobalCoords = this.nombreGlobalCoords;
        this.planta.potencia = this.form.get('potencia').value;
        this.planta.tipo = this.tipo;
        this.planta.vertical = this.vertical;
        this.planta.alturaBajaPrimero = this.form.get('alturaBajaPrimero').value;
        this.planta.autoLocReady = this.form.get('autoLocReady').value;
        this.planta.empresa = this.empresaSelected.uid;

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

  initMap() {
    const satellite = new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: '',
    });
    const satelliteLayer = new TileLayer({
      source: satellite,
    });

    const view = new View({
      center: fromLonLat([this.longitud, this.latitud]),
      zoom: this.zoom,
    });

    this.map = new Map({
      target: 'map',
      layers: [satelliteLayer],
      view,
    });

    this.map.on('moveend', (e) => {
      this.zoom = Number(this.map.getView().getZoom().toFixed(2));
      this.latitud = this.map.getView().getCenter()[1] / 100000;
      this.longitud = this.map.getView().getCenter()[0] / 100000;
    });
  }

  setCenter() {
    this.map.getView().setCenter(fromLonLat([this.longitud, this.latitud]));
  }

  setZoom() {
    this.map.getView().setZoom(this.zoom);
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
}
