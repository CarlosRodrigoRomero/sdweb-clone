import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

import { MapDivision } from '@core/models/mapDivision';

@Component({
  selector: 'app-list-create-map',
  templateUrl: './list-create-map.component.html',
  styleUrls: ['./list-create-map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListCreateMapComponent implements OnChanges {
  @Input() displayedColumns: string;
  @Input() dataSource: MatTableDataSource<any>;
  @Input() mapDivisionSelected: MapDivision;
  @Output() rowSelected = new EventEmitter<any>();

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.mapDivisionSelected && this.mapDivisionSelected) {
      this.scrollToRow(this.mapDivisionSelected);
    }
  }

  scrollToRow(mapDivision: MapDivision) {
    let rowId = 'row-' + mapDivision.id;
    let rowElement = document.getElementById(rowId);
    if (rowElement) {
      rowElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  selectRow(row: any, zoom: boolean) {
    row.zoom = zoom;
    this.rowSelected.emit(row);
  }
}
