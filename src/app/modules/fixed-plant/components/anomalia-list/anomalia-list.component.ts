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

import { Anomalia } from '@core/models/anomalia';

@Component({
  selector: 'app-anomalia-list',
  templateUrl: './anomalia-list.component.html',
  styleUrls: ['./anomalia-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnomaliaListComponent implements OnChanges {
  @Input() viewSeleccionada: string;
  @Input() dataSource: MatTableDataSource<any>;
  @Input() anomaliaHovered: Anomalia;
  @Input() anomaliaSelected: Anomalia;
  @Output() rowHovered = new EventEmitter<any>();
  @Output() rowSelected = new EventEmitter<any>();
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns: string[] = ['colors', 'numAnom', 'tipo', 'temp', 'perdidas', 'gradiente', 'comentarios'];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.dataSource && changes.dataSource.currentValue) {
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    }

    if (changes.anomaliaSelected && changes.anomaliaSelected.currentValue) {
      console.log(this.anomaliaSelected)
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

  selectRow(row: any, zoom: boolean) {
    row.zoom = zoom;
    this.rowSelected.emit(row);
  }
}
