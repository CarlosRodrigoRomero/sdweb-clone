import { Component, OnInit } from '@angular/core';

import { StructuresService } from '@core/services/structures.service';

@Component({
  selector: 'app-structures',
  templateUrl: './structures.component.html',
  styleUrls: ['./structures.component.css'],
})
export class StructuresComponent implements OnInit {
  serviceInit = false;
  deleteMode = false;
  nombrePlanta: string;

  constructor(private structuresService: StructuresService) {}

  ngOnInit(): void {
    this.structuresService.initService().subscribe((value) => (this.serviceInit = value));
    this.structuresService.deleteMode$.subscribe((mode) => (this.deleteMode = mode));
    this.structuresService.planta$.subscribe((planta) => (this.nombrePlanta = planta.nombre));
  }

  loadModuleGroups() {
    this.structuresService.loadModuleGroups = true;
  }

  unloadModuleGroups() {
    this.structuresService.loadModuleGroups = false;
  }

  loadNormModules() {
    // ocultamos los modulos en bruto y las agrupaciones
    this.structuresService.loadModuleGroups = false;

    // mostramos los modulos normalizados
    this.structuresService.loadNormModules = true;
  }

  unloadNormModules() {
    // mostramos los modulos en bruto y las agrupaciones
    this.structuresService.loadModuleGroups = true;

    // ocultamos los modulos normalizados
    this.structuresService.loadNormModules = false;
  }
}
