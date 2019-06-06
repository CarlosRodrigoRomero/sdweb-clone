import { Component, OnInit, Input, EventEmitter, Output } from "@angular/core";
import { PcInterface } from "../../models/pc";
import {
  MatButtonToggleGroup,
  MatCheckboxChange,
  MatSliderChange
} from "@angular/material";
import { PcService } from "../../services/pc.service";
import { GLOBAL } from "../../services/global";

@Component({
  selector: "app-pc-filter",
  templateUrl: "./pc-filter.component.html",
  styleUrls: ["./pc-filter.component.css"]
})
export class PcFilterComponent implements OnInit {
  @Input() public allPcs: PcInterface[];

  public severidad: MatButtonToggleGroup;
  public filtroClase: number[];
  public filtroCategoria: number[];
  public labelsSeveridad = GLOBAL.labels_severidad;
  public descripcionSeveridad = GLOBAL.descripcionSeveridad;
  public numCategorias: Array<number>;
  public numClases: Array<number>;
  public nombreClases: Array<string>;
  public countCategoria: Array<number>;
  public countClase: Array<number>;
  public filtroGradiente: number;
  public global = GLOBAL;

  constructor(private pcService: PcService) {
    this.countCategoria = Array();
    this.countClase = Array();
  }

  ngOnInit() {
    this.pcService.filtroClase$.subscribe(e => (this.filtroClase = e));
    this.pcService.filtroCategoria$.subscribe(e => (this.filtroCategoria = e));
    this.pcService.filtroGradiente$.subscribe(e => (this.filtroGradiente = e));

    this.numCategorias = Array(GLOBAL.labels_tipos.length)
      .fill(0)
      .map((_, i) => i + 1);
    this.numClases = Array(GLOBAL.labels_severidad.length)
      .fill(0)
      .map((_, i) => i + 1);

    this.nombreClases = GLOBAL.pcDescripcion;

    // Calcular los tipos de puntos calientes
    for (const i of this.numCategorias) {
      this.countCategoria.push(this.allPcs.filter(pc => pc.tipo === i).length);
    }

    // Calcular la severidad //
    for (const j of this.numClases) {
      this.countClase.push(this.allPcs.filter(pc => pc.severidad === j).length);
    }
  }

  onCheckBoxClaseChange($event: MatCheckboxChange) {
    const numberChecked = parseInt($event.source.value, 10);
    this.filtroClase = this.filtroClase.filter(i => i !== numberChecked);
    if ($event.checked === true) {
      this.filtroClase.push(numberChecked);
    }
    this.pcService.PushFiltroClase(this.filtroClase);
    // this.pcService.filteredPcs(this.allPcs.filter( (pc) => this.filtroClase.includes(pc.severidad)));
  }

  onChangeCheckboxCategoria($event: MatCheckboxChange) {
    const numberChecked = parseInt($event.source.value, 10);
    this.filtroCategoria = this.filtroCategoria.filter(
      i => i !== numberChecked
    );
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
      return Math.round(value / 1000) + " ºC";
    }

    return value;
  }

  onInputFiltroGradiente($event: MatSliderChange) {
    this.pcService.PushFiltroGradiente($event.value);
  }
}
