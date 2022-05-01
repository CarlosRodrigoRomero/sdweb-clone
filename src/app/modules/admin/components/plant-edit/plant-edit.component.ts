import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Router } from '@angular/router';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipInputEvent } from '@angular/material/chips';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { take } from 'rxjs/operators';

import Map from 'ol/Map';
import XYZ from 'ol/source/XYZ';
import { Tile as TileLayer } from 'ol/layer';
import { View } from 'ol';
import { fromLonLat } from 'ol/proj';
import { FullScreen, defaults as defaultControls } from 'ol/control';

import { PlantaService } from '@data/services/planta.service';
import { AdminService } from '@data/services/admin.service';

import { PlantaInterface } from '@core/models/planta';
import { UserInterface } from '@core/models/user';

@Component({
  selector: 'app-plant-edit',
  templateUrl: './plant-edit.component.html',
  styleUrls: ['./plant-edit.component.css'],
})
export class PlantEditComponent implements OnInit {
  form: FormGroup;
  private plantaId: string;
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
    private router: Router,
    private formBuilder: FormBuilder,
    private plantaService: PlantaService,
    private _snackBar: MatSnackBar,
    private adminService: AdminService
  ) {
    this.buildForm();
  }

  ngOnInit(): void {
    // obtenemos el ID de la URL
    this.plantaId = this.router.url.split('/')[this.router.url.split('/').length - 1];

    // traemos la planta a editar
    this.plantaService
      .getPlanta(this.plantaId)
      .pipe(take(1))
      .subscribe((planta) => {
        this.planta = planta;

        this.nombreGlobalCoords = planta.nombreGlobalCoords;

        this.form.patchValue(this.planta);
      });

    this.adminService
      .getAllUsers()
      .pipe(take(1))
      .subscribe((empresas) => {
        this.empresas = empresas.filter(
          (empresa) =>
            empresa.empresaNombre !== undefined && empresa.empresaNombre !== null && empresa.empresaNombre !== ''
        );

        // esperamos a enviar los datos seleccionados para que no se adelanten a las listas
        setTimeout(() => {
          this.empresaSelected = this.empresas.find((empresa) => empresa.uid === this.planta.empresa);
        }, 1000);
      });

    // this.initMap();
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
      stringConectorGlobals: [],
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();

    if (this.form.get('nombre').value !== null) {
      this.planta.nombre = this.form.get('nombre').value;
    }
    if (this.form.get('filas').value !== null) {
      this.planta.filas = this.form.get('filas').value;
    }
    if (this.form.get('columnas').value !== null) {
      this.planta.columnas = this.form.get('columnas').value;
    }
    if (this.form.get('longitud').value !== undefined) {
      this.planta.longitud = this.form.get('longitud').value;
    }
    if (this.form.get('latitud').value !== undefined) {
      this.planta.latitud = this.form.get('latitud').value;
    }
    if (this.form.get('zoom').value !== undefined) {
      this.planta.zoom = this.form.get('zoom').value;
    }
    if (this.nombreGlobalCoords !== undefined) {
      this.planta.nombreGlobalCoords = this.nombreGlobalCoords;
    }
    if (this.form.get('potencia').value !== null) {
      this.planta.potencia = this.form.get('potencia').value;
    }
    if (this.tipo !== undefined) {
      this.planta.tipo = this.tipo;
    }
    if (this.vertical !== undefined) {
      this.planta.vertical = this.vertical;
    }
    if (this.form.get('alturaBajaPrimero').value !== null) {
      this.planta.alturaBajaPrimero = this.form.get('alturaBajaPrimero').value;
    }
    if (this.form.get('autoLocReady').value !== null) {
      this.planta.autoLocReady = this.form.get('autoLocReady').value;
    }
    if (this.empresaSelected !== undefined) {
      this.planta.empresa = this.empresaSelected.uid;
    }
    if (this.form.get('stringConectorGlobals').value !== null && this.form.get('stringConectorGlobals').value !== '') {
      this.planta.stringConectorGlobals = this.form.get('stringConectorGlobals').value;
    }

    // Actualizamos la planta en la DB
    this.plantaService.updatePlanta(this.planta);

    // aviso de informe creado correctamente
    this.openSnackBar();
  }

  getElemSelected(element: any) {
    this.empresaSelected = element;
  }

  private openSnackBar() {
    this._snackBar.open('Planta actualizada correctamente', 'OK', { duration: 5000 });
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
      controls: defaultControls().extend([new FullScreen()]),
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
      if (this.nombreGlobalCoords !== undefined) {
        this.nombreGlobalCoords.push(value);
      } else {
        this.nombreGlobalCoords = [value];
      }
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
