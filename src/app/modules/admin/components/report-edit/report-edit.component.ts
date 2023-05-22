import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { switchMap, take } from 'rxjs/operators';

import moment from 'moment';

import { MatSnackBar } from '@angular/material/snack-bar';

import { InformeService } from '@data/services/informe.service';
import { PlantaService } from '@data/services/planta.service';
import { ClustersService } from '@data/services/clusters.service';

import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';

@Component({
  selector: 'app-report-edit',
  templateUrl: './report-edit.component.html',
  styleUrls: ['./report-edit.component.css'],
})
export class ReportEditComponent implements OnInit {
  form: FormGroup;
  private informeId: string = undefined;
  informe: InformeInterface = {};
  plantaList: PlantaInterface[] = [];
  vueloList: any[] = [];
  plantaSelected: PlantaInterface = undefined;
  vueloSelected: any = undefined;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private informeService: InformeService,
    private plantaService: PlantaService,
    private clustersService: ClustersService,
    private _snackBar: MatSnackBar
  ) {
    this.buildForm();
  }

  ngOnInit(): void {
    // obtenemos el ID de la URL
    this.informeId = this.router.url.split('/')[this.router.url.split('/').length - 1];

    // traemos el informe seleccionado
    this.informeService
      .getInforme(this.informeId)
      .pipe(
        take(1),
        switchMap((informe) => {
          this.informe = informe;

          this.form.patchValue(this.informe);
          this.form.patchValue({ fecha: moment.unix(this.informe.fecha) });

          return this.plantaService.getAllPlantas();
        })
      )
      .pipe(
        take(1),
        switchMap((plantas) => {
          this.plantaList = plantas.sort((a, b) => {
            if (a.nombre < b.nombre) {
              return -1;
            }
            if (a.nombre > b.nombre) {
              return 1;
            }
            return 0;
          });

          return this.clustersService.getVuelos();
        })
      )
      .pipe(take(1))
      .subscribe((vuelos) => {
        this.vueloList = vuelos;

        // esperamos a enviar los datos seleccionados para que no se adelanten a las listas
        setTimeout(() => {
          // indicamos la planta seleccionada
          this.plantaSelected = this.plantaList.find((planta) => planta.id === this.informe.plantaId);
          // indicamos el vuelo seleccionado
          this.vueloSelected = this.vueloList.find((vuelo) => vuelo.id === this.informe.vueloId);
        }, 1000);
      });
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      fecha: [],
      emisividad: [0.85, [Validators.min(0), Validators.max(1)]],
      temperatura: [],
      tempReflejada: [-30],
      humedadRelativa: [, [Validators.min(0), Validators.max(1)]],
      nubosidad: [, [Validators.min(0), Validators.max(8)]],
      gsd: [3],
      correccHoraSrt: [0],
      disponible: [false],
      vientoVelocidad: [],
      vientoDireccion: [, [Validators.min(0), Validators.max(360)]],
      numeroModulos: [],
      camara: [],
      camaraSN: [],
      servidorCapas: [, [Validators.required]],
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form.valid) {
      if (this.form.get('fecha').value !== null) {
        this.informe.fecha = this.form.get('fecha').value.unix();
      }
      if (this.form.get('emisividad').value !== null) {
        this.informe.emisividad = this.form.get('emisividad').value;
      }
      if (this.form.get('temperatura').value !== null) {
        this.informe.temperatura = this.form.get('temperatura').value;
      }
      if (this.form.get('tempReflejada').value !== null) {
        this.informe.tempReflejada = this.form.get('tempReflejada').value;
      }
      if (this.form.get('humedadRelativa').value !== null) {
        this.informe.humedadRelativa = this.form.get('humedadRelativa').value;
      }
      if (this.form.get('nubosidad').value !== null) {
        this.informe.nubosidad = this.form.get('nubosidad').value;
      }
      if (this.form.get('gsd').value !== null) {
        this.informe.gsd = this.form.get('gsd').value;
      }
      if (this.form.get('correccHoraSrt').value !== null) {
        this.informe.correccHoraSrt = this.form.get('correccHoraSrt').value;
      }
      if (this.form.get('disponible').value !== null) {
        this.informe.disponible = this.form.get('disponible').value;
      }
      if (this.form.get('vientoVelocidad').value !== null) {
        this.informe.vientoVelocidad = this.form.get('vientoVelocidad').value;
      }
      if (this.form.get('vientoDireccion').value !== null) {
        this.informe.vientoDireccion = this.form.get('vientoDireccion').value;
      }
      if (this.form.get('numeroModulos').value !== null) {
        this.informe.numeroModulos = this.form.get('numeroModulos').value;
      }
      if (this.form.get('camara').value !== null) {
        this.informe.camara = this.form.get('camara').value;
      }
      if (this.form.get('camaraSN').value !== null) {
        this.informe.camaraSN = this.form.get('camaraSN').value;
      }
      if (this.form.get('servidorCapas').value !== null) {
        this.informe.servidorCapas = this.form.get('servidorCapas').value;
      }
      if (this.plantaSelected !== undefined) {
        this.informe.plantaId = this.plantaSelected.id;
      }
      if (this.vueloSelected !== undefined) {
        this.informe.vueloId = this.vueloSelected.id;
      }

      // Actualizamos el informe en la DB
      this.informeService.updateInforme(this.informe);

      // aviso de informe creado correctamente
      this.openSnackBar();
    }
  }

  getElemSelected(element: any) {
    if (element.nombre !== undefined) {
      this.plantaSelected = element;
    } else {
      this.vueloSelected = element;
    }
  }

  private openSnackBar() {
    this._snackBar.open('Informe actualizado correctamente', 'OK', { duration: 5000 });
  }
}
