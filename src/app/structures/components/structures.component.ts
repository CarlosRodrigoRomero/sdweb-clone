import { Component, OnInit } from '@angular/core';

import Map from 'ol/Map';

import { StructuresService } from '@core/services/structures.service';
import { OlMapService } from '@core/services/ol-map.service';

@Component({
  selector: 'app-structures',
  templateUrl: './structures.component.html',
  styleUrls: ['./structures.component.css'],
})
export class StructuresComponent implements OnInit {
  serviceInit = false;
  deleteRawModMode = false;
  nombrePlanta: string;
  private map: Map;

  constructor(private structuresService: StructuresService, private olMapService: OlMapService) {}

  ngOnInit(): void {
    this.structuresService.initService().subscribe((value) => (this.serviceInit = value));
    this.structuresService.deleteRawModMode$.subscribe((mode) => (this.deleteRawModMode = mode));
    this.structuresService.planta$.subscribe((planta) => (this.nombrePlanta = planta.nombre));
    this.olMapService.map$.subscribe((map) => (this.map = map));
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

  resetFase1() {
    this.structuresService.deleteRawModMode = undefined;
    this.map.removeInteraction(this.olMapService.draw);
    this.olMapService.draw = undefined;
  }

  resetFase3() {
    this.structuresService.drawModGroups = false;
    this.structuresService.modGroupSelectedId = undefined;
    this.map.removeInteraction(this.olMapService.draw);
    this.olMapService.draw = undefined;
  }

  resetFase5() {
    this.structuresService.normModSelected = undefined;
    this.map.removeInteraction(this.olMapService.draw);
    this.olMapService.draw = undefined;
  }
}
