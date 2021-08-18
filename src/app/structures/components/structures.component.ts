import { Component, OnInit } from '@angular/core';

import Map from 'ol/Map';

import { StructuresService } from '@core/services/structures.service';
import { OlMapService } from '@core/services/ol-map.service';
import { InformeService } from '@core/services/informe.service';
import { InformeInterface } from '@core/models/informe';

@Component({
  selector: 'app-structures',
  templateUrl: './structures.component.html',
  styleUrls: ['./structures.component.css'],
})
export class StructuresComponent implements OnInit {
  serviceInit = false;
  deleteRawModMode = false;
  createRawModMode = false;
  nombrePlanta: string;
  private map: Map;
  private informe: InformeInterface;

  constructor(
    private structuresService: StructuresService,
    private olMapService: OlMapService,
    private informeService: InformeService
  ) {}

  ngOnInit(): void {
    this.structuresService.initService().subscribe((value) => (this.serviceInit = value));
    this.structuresService.deleteRawModMode$.subscribe((mode) => (this.deleteRawModMode = mode));
    this.structuresService.createRawModMode$.subscribe((mode) => (this.createRawModMode = mode));
    this.structuresService.planta$.subscribe((planta) => (this.nombrePlanta = planta.nombre));
    this.olMapService.map$.subscribe((map) => (this.map = map));
    this.informeService.getInforme(this.structuresService.informeId).subscribe((informe) => (this.informe = informe));
  }

  endFilterSubscription() {
    this.structuresService.endFilterSubscription = true;
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

  resetFase2() {
    this.structuresService.deleteRawModMode = undefined;
    this.map.removeInteraction(this.olMapService.draw);
    this.olMapService.draw = undefined;
  }

  resetFase4() {
    this.structuresService.drawModGroups = false;
    this.structuresService.modGroupSelectedId = undefined;
    this.map.removeInteraction(this.olMapService.draw);
    this.olMapService.draw = undefined;
  }

  resetFase6() {
    this.structuresService.normModSelected = undefined;
    this.map.removeInteraction(this.olMapService.draw);
    this.olMapService.draw = undefined;
  }

  setReportNumModules() {
    this.informe.numeroModulos = this.structuresService.reportNumModules;

    // actualizamos el informe en la DB
    this.informeService.updateInforme(this.informe);
  }
}
