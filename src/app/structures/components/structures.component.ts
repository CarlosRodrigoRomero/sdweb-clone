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

  toggleLoadRawModules(load: boolean) {
    // ocultamos los modulos en bruto
    this.structuresService.loadRawModules = load;
  }

  toggleLoadModuleGroups(load: boolean) {
    // mostramos las agrupaciones
    this.structuresService.loadModuleGroups = load;
  }

  toggleLoadNormModules(load: boolean) {
    // mostramos los modulos normalizados
    this.structuresService.loadNormModules = load;
  }

  toggleEditNormModules(edit: boolean) {
    // habilitamos edicion de los módulos normalizados
    this.structuresService.editNormModules = edit;
  }
}
