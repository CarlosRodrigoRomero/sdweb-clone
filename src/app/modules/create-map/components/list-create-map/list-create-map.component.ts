import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-list-create-map',
  templateUrl: './list-create-map.component.html',
  styleUrls: ['./list-create-map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListCreateMapComponent implements OnInit {
  @Input() displayedColumns: string;
  @Input() dataSource: MatTableDataSource<any>;
  @Output() rowSelected = new EventEmitter<any>();

  constructor() {}

  ngOnInit(): void {}

  selectRow(row: any, zoom: boolean) {
    row.zoom = zoom;
    this.rowSelected.emit(row);
  }
}
