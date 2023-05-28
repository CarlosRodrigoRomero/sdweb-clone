import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

import { Subscription, combineLatest } from 'rxjs';

import { Map } from 'ol';

import { MapDivisionsService } from '@data/services/map-divisions.service';
import { MapDivisionControlService } from '@data/services/map-division-control.service';
import { OlMapService } from '@data/services/ol-map.service';
import { MapClippingService } from '@data/services/map-clipping.service';
import { CreateMapService } from '@data/services/create-map.service';

import { MapDivision } from '@core/models/mapDivision';
import { MapClipping } from '@core/models/mapClipping';
import { MapElement } from '@core/models/mapElement';
import { PlantaInterface } from '@core/models/planta';

@Component({
  selector: 'app-list-create-map-container',
  templateUrl: './list-create-map-container.component.html',
  styleUrls: ['./list-create-map-container.component.css'],
})
export class ListCreateMapContainerComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['id', 'type', 'numImages', 'actions'];
  dataSource: MatTableDataSource<MapElement>;
  private mapDivisions: MapDivision[];
  private mapClippings: MapClipping[];
  private map: Map;
  mapDivisionHovered: MapDivision;
  mapDivisionSelected: MapDivision;
  planta: PlantaInterface;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private mapDivisionsService: MapDivisionsService,
    private mapDivisionControlService: MapDivisionControlService,
    private olMapService: OlMapService,
    private mapClippingService: MapClippingService,
    private createMapService: CreateMapService
  ) {}

  ngOnInit(): void {
    this.planta = this.createMapService.planta;

    this.subscriptions.add(this.olMapService.map$.subscribe((map) => (this.map = map)));

    this.subscriptions.add(
      combineLatest([this.mapDivisionsService.getMapDivisions(), this.mapClippingService.getMapClippings()]).subscribe(
        ([mapDivisions, mapClippings]) => {
          this.mapDivisions = mapDivisions;
          this.mapClippings = mapClippings;

          this.dataSource = new MatTableDataSource([...mapDivisions, ...mapClippings]);
        }
      )
    );

    this.subscriptions.add(
      this.mapDivisionControlService.mapDivisionHovered$.subscribe((division) => (this.mapDivisionHovered = division))
    );

    this.subscriptions.add(
      this.mapDivisionControlService.mapDivisionSelected$.subscribe((division) => (this.mapDivisionSelected = division))
    );
  }

  hoverDivision(row: any) {
    let elem;
    if (row.type === 'division') {
      elem = this.mapDivisions.find((division) => division.id === row.id);

      this.mapDivisionControlService.mapDivisionHovered = elem as MapDivision;
    } else {
      elem = this.mapClippings.find((clipping) => clipping.id === row.id);
    }

    // if (this.anomaliasControlService.anomaliaSelect === undefined) {
    //   if (row.hovered) {
    //     this.anomaliasControlService.anomaliaHover = row.anomalia;
    //   } else {
    //     this.anomaliasControlService.anomaliaHover = undefined;
    //   }
    //   this.anomaliasControlService.setExternalStyle(row.id, row.hovered);
    // }
  }

  selectDivision(row: any) {
    const division = this.mapDivisions.find((division) => division.id === row.id);

    // quitamos el hover de la anomalia
    // this.anomaliasControlService.anomaliaHover = undefined;

    // reiniciamos el estilo a la anterior anomalia
    // if (this.anomaliasControlService.prevAnomaliaSelect !== undefined) {
    //   this.anomaliasControlService.setExternalStyle(this.anomaliasControlService.prevAnomaliaSelect.id, false);
    // }
    // this.anomaliasControlService.prevAnomaliaSelect = row.anomalia;

    this.mapDivisionControlService.mapDivisionSelected = division;
    // this.anomaliasControlService.setExternalStyle(row.id, true);

    // centramos la vista al hacer click
    this.centerView(division);
  }

  deleteDivision(id: string) {
    this.mapDivisionsService.deleteMapDivision(id);
  }

  private centerView(mapDivision: MapDivision) {
    this.map.getView().setCenter(mapDivision.coords[0]);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
