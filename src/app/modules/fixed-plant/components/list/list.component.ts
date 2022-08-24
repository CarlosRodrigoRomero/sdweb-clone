import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { Anomalia } from '@core/models/anomalia';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent implements OnInit {
  @Input() dataSource: MatTableDataSource<any>;

  // @Output() anomaliaHovered = new EventEmitter<Anomalia>();

  displayedColumns: string[] = ['colors', 'numAnom', 'tipo', 'temp', 'perdidas', 'gradiente', 'comentarios'];

  constructor() {}

  ngOnInit(): void {}

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // hoverAnomalia(row: any) {
  //   this.anomaliaHovered.emit(row.anomalia);
  // }
}
