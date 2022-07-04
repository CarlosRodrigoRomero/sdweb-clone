import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import Map from 'ol/Map';

import { StructuresService } from '@data/services/structures.service';
import { OlMapService } from '@data/services/ol-map.service';
import { InformeService } from '@data/services/informe.service';
import { ResetServices } from '@data/services/reset-services.service';

import { InformeInterface } from '@core/models/informe';

@Component({
  selector: 'app-structures',
  templateUrl: './structures.component.html',
  styleUrls: ['./structures.component.css'],
})
export class StructuresComponent implements OnInit, OnDestroy {
  serviceInit = false;
  deleteRawModMode = false;
  createRawModMode = false;
  nombrePlanta: string;
  private map: Map;
  informe: InformeInterface;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private structuresService: StructuresService,
    private olMapService: OlMapService,
    private informeService: InformeService,
    private resetServices: ResetServices
  ) {}

  ngOnInit(): void {
    this.structuresService.initService().then((init) => (this.serviceInit = init));
    this.subscriptions.add(
      this.structuresService.deleteRawModMode$.subscribe((mode) => (this.deleteRawModMode = mode))
    );
    this.subscriptions.add(
      this.structuresService.createRawModMode$.subscribe((mode) => (this.createRawModMode = mode))
    );
    this.subscriptions.add(this.structuresService.planta$.subscribe((planta) => (this.nombrePlanta = planta.nombre)));
    this.subscriptions.add(this.olMapService.map$.subscribe((map) => (this.map = map)));
    this.subscriptions.add(
      this.informeService.getInforme(this.structuresService.informeId).subscribe((informe) => (this.informe = informe))
    );
  }

  endFilterSubscription() {
    this.structuresService.endFilterSubscription = true;
  }

  toggleLoadRawModules(load: boolean) {
    // ocultamos los modulos en bruto
    this.structuresService.loadRawModules = load;
  }

  toggleLoadNormModules(load: boolean) {
    // mostramos los modulos normalizados
    this.structuresService.loadNormModules = load;
  }

  toggleEditNormModulesPhase(edit: boolean) {
    // habilitamos edicion de los módulos normalizados
    this.structuresService.editNormModules = edit;
  }

  resetAddDelRawModulesPhase() {
    this.structuresService.deleteRawModMode = undefined;
    this.map.removeInteraction(this.olMapService.draw);
    this.olMapService.draw = undefined;
  }

  resetEditGroupsPhase() {
    this.structuresService.drawModGroups = false;
    this.structuresService.modGroupSelectedId = undefined;
    this.map.removeInteraction(this.olMapService.draw);
    this.olMapService.draw = undefined;
  }

  resetEditNormModules() {
    this.structuresService.normModSelected = undefined;
    this.map.removeInteraction(this.olMapService.draw);
    this.olMapService.draw = undefined;
  }

  setReportNumModules() {
    this.informe.numeroModulos = this.structuresService.reportNumModules;

    // actualizamos el informe en la DB
    this.informeService.updateInforme(this.informe);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();

    // reseteamos los servicios a sus valores por defecto
    this.resetServices.resetServices();
  }
}
