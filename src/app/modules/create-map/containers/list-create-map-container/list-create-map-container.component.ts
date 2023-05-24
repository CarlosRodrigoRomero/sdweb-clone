import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

import { Subscription } from 'rxjs';

import { MapDivisionsService } from '@data/services/map-divisions.service';

import { MapDivision } from '@core/models/mapDivision';

@Component({
  selector: 'app-list-create-map-container',
  templateUrl: './list-create-map-container.component.html',
  styleUrls: ['./list-create-map-container.component.css'],
})
export class ListCreateMapContainerComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['num', 'precise', 'status', 'numImages', 'actions'];
  dataSource: MatTableDataSource<MapDivision>;

  private subscriptions: Subscription = new Subscription();

  constructor(private mapDivisionsService: MapDivisionsService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.mapDivisionsService.getMapDivisions().subscribe((mapDivisions) => {
        this.dataSource = new MatTableDataSource(mapDivisions);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
