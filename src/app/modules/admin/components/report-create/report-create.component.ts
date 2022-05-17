import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { take } from 'rxjs/operators';

import { MatSnackBar } from '@angular/material/snack-bar';

import { InformeService } from '@data/services/informe.service';
import { PlantaService } from '@data/services/planta.service';
import { ClustersService } from '@data/services/clusters.service';

import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';

@Component({
  selector: 'app-report-create',
  templateUrl: './report-create.component.html',
  styleUrls: ['./report-create.component.css'],
})
export class ReportCreateComponent implements OnInit {
  form: FormGroup;
  informe: InformeInterface = {};
  plantaList: PlantaInterface[] = [];
  vueloList: any[] = [];
  private plantaSelected: PlantaInterface;
  private vueloSelected: any;
  reportCreated = false;

  constructor(
    private formBuilder: FormBuilder,
    private informeService: InformeService,
    private plantaService: PlantaService,
    private clustersService: ClustersService,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.plantaService
      .getAllPlantas()
      .pipe(take(1))
      .subscribe((plantas) => {
        this.plantaList = plantas.sort((a, b) => {
          if (a.nombre < b.nombre) {
            return -1;
          }
          if (a.nombre > b.nombre) {
            return 1;
          }
          return 0;
        });
      });

    this.clustersService
      .getVuelos()
      .pipe(take(1))
      .subscribe((vuelos) => (this.vueloList = vuelos));

    this.buildForm();
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
      correccHoraSrt: [0, [Validators.required]],
      disponible: [false, [Validators.required]],
      vientoVelocidad: [, [Validators.required]],
      vientoDireccion: [, [Validators.required, Validators.min(0), Validators.max(360)]],
      camara: [, [Validators.required]],
      camaraSN: [, [Validators.required]],
    });
  }

  onSubmit(event: Event) {
    if (this.plantaSelected && this.vueloSelected) {
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
        this.informe.camara = this.form.get('camara').value;
        this.informe.camaraSN = this.form.get('camaraSN').value;
        this.informe.plantaId = this.plantaSelected.id;
        this.informe.vueloId = this.vueloSelected.id;

        // Crea el informe en la DB
        this.informeService.addInforme(this.informe);

        // aviso de informe creado correctamente
        this.openSnackBar();

        this.reportCreated = true;
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
    this._snackBar.open('Informe creado correctamente', 'OK', { duration: 5000 });
  }
}
