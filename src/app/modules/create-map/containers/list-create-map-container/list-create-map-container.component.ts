import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

import { Subscription, combineLatest } from 'rxjs';

import { Map } from 'ol';

import { MapDivisionsService } from '@data/services/map-divisions.service';
import { MapDivisionControlService } from '@data/services/map-division-control.service';
import { OlMapService } from '@data/services/ol-map.service';
import { MapClippingService } from '@data/services/map-clipping.service';
import { CreateMapService } from '@data/services/create-map.service';
import { MapClippingControlService } from '@data/services/map-clipping-control.service';

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
    private createMapService: CreateMapService,
    private mapClippingControlService: MapClippingControlService
  ) {}

  ngOnInit(): void {
    this.planta = this.createMapService.planta;

    this.subscriptions.add(this.olMapService.map$.subscribe((map) => (this.map = map)));

    this.subscriptions.add(
      combineLatest([this.mapDivisionsService.getMapDivisions(), this.mapClippingService.getMapClippings()]).subscribe(
        ([mapDivisions, mapClippings]) => {
          this.mapDivisions = mapDivisions.filter((d) => mapClippings.map((c) => c.id).includes(d.id) === false);
          this.mapClippings = mapClippings;

          this.dataSource = new MatTableDataSource([...this.mapDivisions, ...this.mapClippings]);
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

  selectElem(row: any) {
    if (row.type === 'division') {
      this.selectDivision(row);
    } else {
      this.selectClipping(row);
    }
  }

  hoverDivision(row: any) {
    let elem;
    if (row.type === 'division') {
      elem = this.mapDivisions.find((division) => division.id === row.id);

      this.mapDivisionControlService.mapDivisionHovered = elem as MapDivision;
    } else {
      elem = this.mapClippings.find((clipping) => clipping.id === row.id);
    }
  }

  private selectDivision(row: any) {
    const division = this.mapDivisions.find((division) => division.id === row.id);

    this.mapDivisionControlService.mapDivisionSelected = division;

    // centramos la vista al hacer click
    // this.centerView(division);
  }

  deleteDivision(id: string) {
    this.mapDivisionsService.deleteMapDivision(id);
  }

  private selectClipping(row: any) {
    const clipping = this.mapClippings.find((clipping) => clipping.id === row.id);

    this.mapClippingControlService.mapClippingSelected = clipping;

    // centramos la vista al hacer click
    // this.centerView(clipping);
  }

  hideClipping(id: string) {
    const clipping = this.mapClippings.find((clipping) => clipping.id === id);
    clipping.visible = !clipping.visible;
    this.mapClippingService.updateMapClipping(clipping);
  }

  private centerView(mapElem: MapElement) {
    this.map.getView().setCenter(mapElem.coords[0]);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
