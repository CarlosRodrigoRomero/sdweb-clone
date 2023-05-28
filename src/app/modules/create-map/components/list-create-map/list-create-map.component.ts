import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { MapDivision } from '@core/models/mapDivision';
import { PlantaInterface } from '@core/models/planta';

@Component({
  selector: 'app-list-create-map',
  templateUrl: './list-create-map.component.html',
  styleUrls: ['./list-create-map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListCreateMapComponent implements OnChanges {
  @Input() planta: PlantaInterface;
  @Input() displayedColumns: string;
  @Input() dataSource: MatTableDataSource<any>;
  @Input() mapDivisionHovered: MapDivision;
  @Input() mapDivisionSelected: MapDivision;
  @Output() rowSelected = new EventEmitter<any>();
  @Output() rowHovered = new EventEmitter<any>();
  @Output() mapDivisionDelete = new EventEmitter<any>();
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    // if (changes.mapDivisionSelected && this.mapDivisionSelected) {
    //   this.scrollToRow(this.mapDivisionSelected);
    // }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  scrollToRow(mapDivision: MapDivision) {
    let rowId = 'row-' + mapDivision.id;
    let rowElement = document.getElementById(rowId);
    if (rowElement) {
      rowElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  hoverRow(row: any, zoom: boolean) {
    row.zoom = zoom;
    this.rowHovered.emit(row);
  }

  selectRow(row: any, zoom: boolean) {
    row.zoom = zoom;
    this.rowSelected.emit(row);
  }
}
