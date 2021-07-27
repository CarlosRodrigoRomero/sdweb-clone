import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MatSnackBar } from '@angular/material/snack-bar';

import { take } from 'rxjs/operators';

import Map from 'ol/Map';
import XYZ from 'ol/source/XYZ';
import { Tile as TileLayer } from 'ol/layer';
import { View } from 'ol';
import { fromLonLat } from 'ol/proj';

import { PlantaService } from '@core/services/planta.service';
import { AdminService } from '@core/services/admin.service';

import { PlantaInterface } from '@core/models/planta';
import { UserInterface } from '@core/models/user';

@Component({
  selector: 'app-plant-create',
  templateUrl: './plant-create.component.html',
  styleUrls: ['./plant-create.component.css'],
})
export class PlantCreateComponent implements OnInit {
  form: FormGroup;
  planta: PlantaInterface;
  plantCreated = false;
  empresas: UserInterface[];
  empresaSelected: UserInterface;
  private map: Map;
  zoom = 5.65;
  latitud = 40;
  longitud = -4.4;

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
      filas: [, [Validators.required]],
      columnas: [, [Validators.required]],
      latitud: [, [Validators.required]],
      longitud: [, [Validators.required]],
      zoom: [, [Validators.required]],
      // moduloPotencia: [, [Validators.required]],
      // nombreGlobalCoords: [],
      // num_modulos: [],
      // potencia: [, [Validators.required]],
      // tipo: [, [Validators.required]],
      // vertical: [false, [Validators.required]],
    });
  }

  onSubmit(event: Event) {
    if (this.empresaSelected !== undefined) {
      event.preventDefault();
      if (this.form.valid) {
        this.planta.nombre = this.form.get('nombre').value;

        // this.informe.fecha = this.form.get('fecha').value.unix();
        // this.informe.emisividad = this.form.get('emisividad').value;
        // this.informe.temperatura = this.form.get('temperatura').value;
        // this.informe.tempReflejada = this.form.get('tempReflejada').value;
        // this.informe.humedadRelativa = this.form.get('humedadRelativa').value;
        // this.informe.nubosidad = this.form.get('nubosidad').value;
        // this.informe.gsd = this.form.get('gsd').value;
        // this.informe.correccHoraSrt = this.form.get('correccHoraSrt').value;
        // this.informe.disponible = this.form.get('disponible').value;
        // this.informe.vientoVelocidad = this.form.get('vientoVelocidad').value;
        // this.informe.vientoDireccion = this.form.get('vientoDireccion').value;
        // this.informe.plantaId = this.plantaSelected.id;
        // this.informe.vueloId = this.vueloSelected.id;

        // Crea la planta en la DB
        // this.informeService.addInforme(this.informe);

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

    this.map = new Map({
      target: 'map',
      layers: [satelliteLayer],
      view: new View({
        projection: 'EPSG:4326',
        center: [this.longitud, this.latitud],
        zoom: this.zoom,
      }),
    });

    this.map.on('moveend', (e) => {
      this.zoom = Number(this.map.getView().getZoom().toFixed(2));
      this.latitud = this.map.getView().getCenter()[1];
      this.longitud = this.map.getView().getCenter()[0];
    });
  }

  setCenter() {
    this.map.getView().setCenter([this.longitud, this.latitud]);
  }

  setZoom() {
    this.map.getView().setZoom(this.zoom);
  }
}
