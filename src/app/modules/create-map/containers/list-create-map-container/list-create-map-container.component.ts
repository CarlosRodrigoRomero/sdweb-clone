import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

import { MapDivisionsService } from '@data/services/map-divisions.service';

import { MapDivision } from '@core/models/mapDivision';

@Component({
  selector: 'app-list-create-map-container',
  templateUrl: './list-create-map-container.component.html',
  styleUrls: ['./list-create-map-container.component.css'],
})
export class ListCreateMapContainerComponent implements OnInit {
  displayedColumns: string[] = ['id', 'precise', 'status'];
  dataSource: MatTableDataSource<MapDivision>;

  constructor(private mapDivisionsService: MapDivisionsService) {}

  ngOnInit(): void {
    this.mapDivisionsService.getMapDivisions().subscribe((mapDivisions) => {
      this.dataSource = new MatTableDataSource(mapDivisions);
    });
  }
}
