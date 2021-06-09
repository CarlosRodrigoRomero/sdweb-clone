import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { ReplaySubject, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { MatSelect } from '@angular/material/select';

import { InformeService } from '@core/services/informe.service';
import { PlantaService } from '@core/services/planta.service';

import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';

@Component({
  selector: 'app-report-create',
  templateUrl: './report-create.component.html',
  styleUrls: ['./report-create.component.css'],
})
export class ReportCreateComponent implements OnInit /* , AfterViewInit, OnDestroy */ {
  form: FormGroup;
  informe: InformeInterface = {};
  plantaList: PlantaInterface[] = [];
  public filteredPlantas: ReplaySubject<PlantaInterface[]> = new ReplaySubject<PlantaInterface[]>(1);

  /** control for the selected bank */
  public plantaCtrl: FormControl = new FormControl('', Validators.required);

  /** control for the MatSelect filter keyword */
  public plantaFilterCtrl: FormControl = new FormControl();

  @ViewChild('singleSelect', { static: true }) singleSelect: MatSelect;

  /** Subject that emits when the component has been destroyed. */
  protected _onDestroy = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private informeService: InformeService,
    private plantaService: PlantaService
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
        // this.plantaCtrl.setValue(this.plantaList);

        // cargamos la lista inicial de plantas
        // this.filteredPlantas.next(this.plantaList.slice());
      });

    // escuchamos cuando se active el input de busqueda
    /* this.plantaFilterCtrl.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe(() => {
      this.filterPlantas();
    }); */

    this.buildForm();
  }

  /* ngAfterViewInit() {
    this.setInitialValue();
  } */

  private buildForm() {
    this.form = this.formBuilder.group({
      planta: [, [Validators.required]],
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
    // this.form.addControl('planta', this.plantaCtrl);
  }

  onSubmit(event: Event) {
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
      this.informe.plantaId = this.form.get('planta').value.id;

      // Crea el informe en la DB
      this.informeService.addInforme(this.informe);
    }
  }

  /* protected setInitialValue() {
    this.plantaService
      .getAllPlantas()
      .pipe(take(1), takeUntil(this._onDestroy))
      .subscribe(() => {
        // setting the compareWith property to a comparison function
        // triggers initializing the selection according to the initial value of
        // the form control (i.e. _initializeSelection())
        // this needs to be done after the filteredBanks are loaded initially
        // and after the mat-option elements are available
        this.singleSelect.compareWith = (a: PlantaInterface, b: PlantaInterface) => a && b && a.id === b.id;
      });
  }

  protected filterPlantas() {
    if (!this.plantaList) {
      return;
    }
    // get the search keyword
    let search = this.plantaFilterCtrl.value;
    if (!search) {
      this.filteredPlantas.next(this.plantaList.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filtramos las plantas
    this.filteredPlantas.next(this.plantaList.filter((planta) => planta.nombre.toLowerCase().indexOf(search) > -1));
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  } */
}
