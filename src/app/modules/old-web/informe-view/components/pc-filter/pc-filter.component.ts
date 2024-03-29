import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { PcInterface } from '@core/models/pc';
import { MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatSliderChange } from '@angular/material/slider';
import { PcService } from '@data/services/pc.service';
import { FilterService } from '@data/services/filter.service';
import { GLOBAL } from '@data/constants/global';
import { PlantaService } from '@data/services/planta.service';
import { ExplicacionCoaComponent } from '../explicacion-coa/explicacion-coa.component';
import { CriteriosClasificacion } from '@core/models/criteriosClasificacion';
import { take, map } from 'rxjs/operators';
import { PlantaInterface } from '@core/models/planta';
import { LatLngLiteral } from '@agm/core';

@Component({
  selector: 'app-pc-filter',
  templateUrl: './pc-filter.component.html',
  styleUrls: ['./pc-filter.component.css'],
})
export class PcFilterComponent implements OnInit, OnDestroy {
  @Input() public allPcs: PcInterface[];
  @Input() public planta: PlantaInterface;

  public severidad: MatButtonToggleGroup;
  public filtroClase: number[];
  public filtroCategoria: number[];
  public labelsSeveridad = GLOBAL.labels_clase;
  public descripcionSeveridad = GLOBAL.descripcionClase;
  public numCategorias: Array<number>;
  public numClases: Array<number>;
  public nombreClases: Array<string>;
  public countCategoria: Array<number>;
  public countClase: Array<number>;
  public countCategoriaFiltrada: Array<number>;
  public countClaseFiltrada: Array<number>;
  public filtroGradiente: number;
  public minGradiente: number;
  public maxGradiente: number;
  public criterio: CriteriosClasificacion;

  constructor(
    public dialog: MatDialog,
    private pcService: PcService,
    private plantaService: PlantaService,
    private filterService: FilterService
  ) {
    this.countCategoria = Array();
    this.countClase = Array();
  }
  ngOnDestroy() {
    const numCategorias = Array(GLOBAL.labels_tipos.length)
      .fill(0)
      .map((_, i) => i + 1);
    const numClases = Array(GLOBAL.labels_clase.length)
      .fill(0)
      .map((_, i) => i + 1);
    this.pcService.PushFiltroClase(numClases);
    this.pcService.PushFiltroCategoria(numCategorias);
  }

  ngOnInit() {
    this.pcService.filtroClase$.subscribe((e) => (this.filtroClase = e));
    this.pcService.filtroCategoria$.subscribe((e) => (this.filtroCategoria = e));
    this.pcService.filtroGradiente$.subscribe((e) => (this.filtroGradiente = e));

    this.numCategorias = Array(GLOBAL.labels_tipos.length)
      .fill(0)
      .map((_, i) => i + 1);
    this.numClases = Array(GLOBAL.labels_clase.length)
      .fill(0)
      .map((_, i) => i + 1);

    this.nombreClases = GLOBAL.pcDescripcion;

    // Calcular los tipos de puntos calientes
    for (const i of this.numCategorias) {
      this.countCategoria.push(this.allPcs.filter((pc) => pc.tipo === i).length);
    }

    // Calcular la severidad //
    for (const j of this.numClases) {
      this.countClase.push(this.allPcs.filter((pc) => this.pcService.getPcCoA(pc) === j).length);
    }

    this.pcService.currentFilteredPcs$.subscribe((pcs) => {
      this.calcularInforme(pcs);
    });

    // Setear min y max gradiente
    this.maxGradiente = GLOBAL.maxGradiente;
    this.minGradiente = GLOBAL.minGradiente;

    this.plantaService
      .getPlanta(this.planta.id)
      .pipe(take(1))
      .subscribe((planta) => {
        if (planta.hasOwnProperty('criterioId')) {
          this.plantaService
            .getCriterioCriticidad(planta.criterioId)
            .pipe(take(1))
            .subscribe((criterio) => {
              this.minGradiente = criterio.rangosDT[0];
              this.pcService.PushFiltroGradiente(this.minGradiente);
              this.criterio = criterio;
            });
        } else {
          this.plantaService
            .getCriterioCriticidad(GLOBAL.criterioSolardroneId)
            .pipe(take(1))
            .subscribe((criterio) => {
              this.minGradiente = criterio.rangosDT[0];
              this.pcService.PushFiltroGradiente(this.minGradiente);
              this.criterio = criterio;
            });
        }
      });
  }

  private compare(a: PcInterface, b: PcInterface) {
    if (a.global_x < b.global_x) {
      return -1;
    }
    if (a.global_x > b.global_x) {
      return 1;
    }
    return 0;
  }

  private calcularInforme(pcs: PcInterface[]) {
    this.countCategoriaFiltrada = Array();
    this.countClaseFiltrada = Array();

    const allPcs = pcs;
    allPcs.sort(this.compare);

    // CATEGORIAS //
    let filtroCategoria;
    let filtroCategoriaClase;
    for (const cat of this.numCategorias) {
      filtroCategoria = allPcs.filter((pc) => pc.tipo === cat);
      this.countCategoriaFiltrada.push(filtroCategoria.length);

      const count1 = Array();
      for (const clas of this.numClases) {
        filtroCategoriaClase = allPcs.filter((pc) => this.pcService.getPcCoA(pc) === clas && pc.tipo === cat);
        count1.push(filtroCategoriaClase.length);
      }
    }

    // CLASES //
    let filtroClase;
    for (const j of this.numClases) {
      filtroClase = allPcs.filter((pc) => this.pcService.getPcCoA(pc) === j);

      this.countClaseFiltrada.push(filtroClase.length);
    }
  }

  onCheckBoxClaseChange($event: MatCheckboxChange) {
    const numberChecked = parseInt($event.source.value, 10);
    this.filtroClase = this.filtroClase.filter((i) => i !== numberChecked);
    if ($event.checked === true) {
      this.filtroClase.push(numberChecked);
    }
    this.pcService.PushFiltroClase(this.filtroClase);
    // this.pcService.filteredPcs(this.allPcs.filter( (pc) => this.filtroClase.includes(this.pcService.getPcCoA(pc))));
  }

  onChangeCheckboxCategoria($event: MatCheckboxChange) {
    const numberChecked = parseInt($event.source.value, 10);
    this.filtroCategoria = this.filtroCategoria.filter((i) => i !== numberChecked);
    if ($event.checked === true) {
      this.filtroCategoria.push(numberChecked);
    }
    this.pcService.PushFiltroCategoria(this.filtroCategoria);
    // this.pcService.filteredPcs(this.allPcs.filter( (pc, i, a) => this.filtroCategoria.includes(pc.tipo)));
  }

  formatLabel(value: number | null) {
    if (!value) {
      return this.filtroGradiente;
    }

    if (value >= 1000) {
      return Math.round(value / 1000) + ' ºC';
    }

    return value;
  }

  onInputFiltroGradiente(event: MatSliderChange) {
    this.filtroGradiente = event.value;
  }

  onChangeFiltroGradiente() {
    this.pcService.PushFiltroGradiente(this.filtroGradiente);
  }

  onClickExplicacionCoA() {
    const dialogRef = this.dialog.open(ExplicacionCoaComponent, {
      width: '1000px',
      // height: '600px',
      hasBackdrop: true,
      data: {
        criterio: this.criterio,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {});
  }

  /* areaToFilteredPcs() {
    const path: LatLngLiteral[] = []; // recorrer con un for

    let point: LatLngLiteral;
    if (this.filterService.areas.length > 0) {
      this.pcService.currentFilteredPcs$
        .pipe(
          map((pcs) =>
            pcs.filter((pc) => this.filterService.isContained((point = { lat: pc.gps_lat, lng: pc.gps_lng }), path))
          )
        )
        .subscribe((pcs) => {
          this.calcularInforme(pcs);
        });
    } else {
      this.pcService.currentFilteredPcs$.subscribe((pcs) => {
        this.calcularInforme(pcs);
      });
    }
  } */
}
