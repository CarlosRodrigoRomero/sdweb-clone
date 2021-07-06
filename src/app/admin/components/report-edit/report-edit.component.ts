import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { switchMap, take } from 'rxjs/operators';

import moment from 'moment';

import { MatSnackBar } from '@angular/material/snack-bar';

import { InformeService } from '@core/services/informe.service';
import { PlantaService } from '@core/services/planta.service';
import { ClustersService } from '@core/services/clusters.service';

import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';
import { BehaviorSubject, pipe } from 'rxjs';

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
      fecha: [, [Validators.required]],
      emisividad: [0.85, [Validators.required, Validators.min(0), Validators.max(1)]],
      temperatura: [, [Validators.required]],
      tempReflejada: [-30, [Validators.required]],
      humedadRelativa: [, [Validators.required, Validators.min(0), Validators.max(1)]],
      nubosidad: [, [Validators.required, Validators.min(0), Validators.max(8)]],
      gsd: [3, [Validators.required]],
      correccHoraSrt: [8, [Validators.required]],
      disponible: [false, [Validators.required]],
      vientoVelocidad: [, [Validators.required]],
      vientoDireccion: [, [Validators.required, Validators.min(0), Validators.max(360)]],
    });
  }

  onSubmit(event: Event) {
    if (this.plantaSelected !== undefined && this.vueloSelected !== undefined) {
      event.preventDefault();
      if (this.form.valid) {
        this.informe.fecha = this.form.get('fecha').value.unix();
        this.informe.emisividad = this.form.get('emisividad').value;
        this.informe.temperatura = this.form.get('temperatura').value;
        this.informe.tempReflejada = this.form.get('tempReflejada').value;
        this.informe.humedadRelativa = this.form.get('humedadRelativa').value;
        this.informe.nubosidad = this.form.get('nubosidad').value;
        this.informe.gsd = this.form.get('gsd').value;
        this.informe.correccHoraSrt = this.form.get('correccHoraSrt').value;
        this.informe.disponible = this.form.get('disponible').value;
        this.informe.vientoVelocidad = this.form.get('vientoVelocidad').value;
        this.informe.vientoDireccion = this.form.get('vientoDireccion').value;
        this.informe.plantaId = this.plantaSelected.id;
        this.informe.vueloId = this.vueloSelected.id;

        // Crea el informe en la DB
        this.informeService.updateInforme(this.informe);

        // aviso de informe creado correctamente
        this.openSnackBar();
      }
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
