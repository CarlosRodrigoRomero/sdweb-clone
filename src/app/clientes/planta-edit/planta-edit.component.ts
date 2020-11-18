import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { PlantaInterface } from '../../core/models/planta';
import { PlantaService } from '../../core/services/planta.service';
import { ModuloInterface } from '../../core/models/modulo';
import { CriteriosClasificacion } from '../../core/models/criteriosClasificacion';
import { InformeService } from '../../core/services/informe.service';
import { take } from 'rxjs/operators';
import { PcService } from '../../core/services/pc.service';
import { GLOBAL } from '../../core/services/global';

@Component({
  selector: 'app-planta-edit',
  templateUrl: './planta-edit.component.html',
  styleUrls: ['./planta-edit.component.css'],
})
export class PlantaEditComponent implements OnInit {
  public plantaId: string;
  public planta: PlantaInterface;
  form: FormGroup;
  loading: boolean;
  success: boolean;
  public modulos: ModuloInterface[];
  public allModulos: ModuloInterface[];
  public criterios: CriteriosClasificacion[];
  public critSeleccionado: CriteriosClasificacion;

  constructor(
    private plantaService: PlantaService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private informeService: InformeService,
    private pcService: PcService
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.plantaId = this.route.snapshot.paramMap.get('plantaId');
    this.plantaService.getModulos().subscribe((allModulos) => {
      this.allModulos = allModulos;
    });

    this.plantaService.getPlanta(this.plantaId).subscribe((planta) => {
      this.planta = planta;
      if (planta.hasOwnProperty('criterioId')) {
        this.plantaService.getCriterio(planta.criterioId).subscribe((criterio) => {
          this.critSeleccionado = criterio;
        });
      }

      this.form.setValue({
        nombre: planta.nombre,
        tipo: planta.tipo,
        longitud: planta.longitud,
        latitud: planta.latitud,
        potencia: planta.potencia,
        empresa: planta.empresa,
        filas: planta.filas,
        columnas: planta.columnas,
        num_modulos: planta.num_modulos,
        moduloPotencia: planta.hasOwnProperty('moduloPotencia') ? planta.moduloPotencia : 0,
        vertical: planta.vertical,
        zoom: planta.zoom,
        alturaBajaPrimero: planta.alturaBajaPrimero ? true : false,
        id: planta.id,
        modulos: planta.hasOwnProperty('modulos') ? planta.modulos : [],
        referenciaSolardrone: planta.hasOwnProperty('referenciaSolardrone') ? planta.referenciaSolardrone : true,
      });
    });

    this.plantaService.getCriterios().subscribe((criterios) => {
      this.criterios = criterios;
    });
  }
  initializeForm() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required]],
      tipo: ['fija', [Validators.required]],
      longitud: [0, [Validators.required, Validators.min(-90), Validators.max(90)]],
      latitud: [0, [Validators.required, Validators.min(-90), Validators.max(90)]],
      potencia: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
      empresa: ['', [Validators.required]],
      filas: [2, [Validators.required]],
      columnas: [1, [Validators.required]],
      num_modulos: [1, [Validators.required]],
      moduloPotencia: [0],
      vertical: [true, [Validators.required]],
      zoom: 17,
      alturaBajaPrimero: false,
      id: null,
      modulos: [],
      referenciaSolardrone: true,
    });
  }

  async submitForm() {
    this.loading = true;

    const planta = this.form.value;
    console.log('TCL: PlantaEditComponent -> submitForm -> planta', planta);

    try {
      this.plantaService.updatePlanta(planta);
    } catch (err) {
      console.log(err);
    }

    this.loading = false;
  }

  simularCriteriosClasificacion(criterio: CriteriosClasificacion) {
    // Obtener informes de la planta
    this.informeService
      .getInformesDePlanta(this.plantaId)
      .pipe(take(1))
      .subscribe((informes) => {
        informes.forEach((informe) => {
          // Obtener pcs del informe
          this.pcService
            .getPcsSinFiltros(informe.id)
            .pipe(take(1))
            .subscribe((pcs) => {
              pcs.forEach((pc) => {
                if (criterio.hasOwnProperty('critCoA')) {
                  const newCoA = this.pcService.getCoA(pc, criterio.critCoA);

                  if (newCoA !== pc.severidad && pc.tipo !== 0) {
                    console.log(
                      'Tipo: ',
                      GLOBAL.labels_tipos[pc.tipo],
                      '| Temp: ',
                      pc.temperaturaMax,
                      ' | DT(n): ',
                      pc.gradienteNormalizado,
                      ' | Old CoA: ',
                      pc.severidad,
                      ' | New CoA: ',
                      newCoA
                    );
                  }

                  // pc.severidad = newCoA;
                  // this.pcService.updatePc(pc);
                }
              });
            });
        });
      });

    // if (criterios.hasOwnProperty('critCategoria')) {

    // }
  }

  aplicarCriteriosClasificacion(criterio: CriteriosClasificacion) {
    this.planta.criterioId = criterio.id;
    this.plantaService.updatePlanta(this.planta);

    // Obtener informes de la planta
    this.informeService
      .getInformesDePlanta(this.plantaId)
      .pipe(take(1))
      .subscribe((informes) => {
        informes.forEach((informe) => {
          // Obtener pcs del informe
          this.pcService
            .getPcsSinFiltros(informe.id)
            .pipe(take(1))
            .subscribe((pcs) => {
              pcs.forEach((pc) => {
                if (criterio.hasOwnProperty('critCoA')) {
                  pc.clase = this.pcService.getCoA(pc, criterio.critCoA);
                  this.pcService.updatePc(pc);
                }
              });
            });
        });
      });

    // if (criterios.hasOwnProperty('critCategoria')) {

    // }
  }
}
