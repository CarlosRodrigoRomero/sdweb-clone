import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { Seguidor } from '@core/models/seguidor';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css'],
})
export class ListComponent implements OnChanges {
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() viewSeleccionada: number;
  @Input() dataSource: MatTableDataSource<any>;
  @Input() displayedColumns: string[];
  @Input() seguidorHovered: Seguidor;
  @Input() seguidorSelected: Seguidor;
  @Output() rowHovered = new EventEmitter<any>();
  @Output() rowSelected = new EventEmitter<any>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty('dataSource') && changes.dataSource.currentValue !== undefined) {
      console.log(changes);
      this.dataSource = changes.dataSource.currentValue;
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  hoverRow(row: any, hovered: boolean) {
    row.hovered = hovered;
    this.rowHovered.emit(row);
  }

  selectRow(row: any) {
    this.rowSelected.emit(row);
  }
}
