import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

import { Subscription } from 'rxjs';

import { Map } from 'ol';

import { MapDivisionsService } from '@data/services/map-divisions.service';
import { MapDivisionControlService } from '@data/services/map-division-control.service';
import { OlMapService } from '@data/services/ol-map.service';

import { MapDivision } from '@core/models/mapDivision';

@Component({
  selector: 'app-list-create-map-container',
  templateUrl: './list-create-map-container.component.html',
  styleUrls: ['./list-create-map-container.component.css'],
})
export class ListCreateMapContainerComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['num', 'precise', /* 'status', */ 'numImages', 'actions'];
  dataSource: MatTableDataSource<MapDivision>;
  private mapDivisions: MapDivision[];
  private map: Map;
  mapDivisionSelected: MapDivision;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private mapDivisionsService: MapDivisionsService,
    private mapDivisionControlService: MapDivisionControlService,
    private olMapService: OlMapService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(this.olMapService.map$.subscribe((map) => (this.map = map)));

    this.subscriptions.add(
      this.mapDivisionsService.getMapDivisions().subscribe((mapDivisions) => {
        this.mapDivisions = mapDivisions;

        this.dataSource = new MatTableDataSource(mapDivisions);
      })
    );

    this.subscriptions.add(
      this.mapDivisionControlService.mapDivisionSelected$.subscribe((division) => (this.mapDivisionSelected = division))
    );
  }

  hoverDivision(row: any) {
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
