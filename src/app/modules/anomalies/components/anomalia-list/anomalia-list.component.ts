import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  ElementRef,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatRow } from '@angular/material/table';

import { Anomalia } from '@core/models/anomalia';

import { AnomaliasControlService } from '@data/services/anomalias-control.service';

interface Page {
  page: number;
  firstRowInPage: any;
}

@Component({
  selector: 'app-anomalia-list',
  templateUrl: './anomalia-list.component.html',
  styleUrls: ['./anomalia-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Animación para expandir las filas de la tabla
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
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
  // Para permitir a la tabla hacer scroll a la anomalía seleccionada
  @ViewChildren(MatRow, { read: ElementRef }) rows!: QueryList<ElementRef<HTMLTableRowElement>>;
  expandedRow: Anomalia | null;
  selectedRowId: string;
  rowId: string;

  displayedColumns: string[] = ['colors', 'numAnom', 'tipo', 'temp', 'perdidas', 'gradiente'];

  constructor(private anomaliasControlService: AnomaliasControlService) {}

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes.dataSource && changes.dataSource.currentValue) {
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    }
    // Al seleccionar una anomalía, se dan varios pasos:
    if (changes.anomaliaSelected && changes.anomaliaSelected.currentValue) {
      let { page, firstRowInPage } = this.findPage();

      if (this.paginator.pageIndex != page - 1) {
        await new Promise((resolve) => {
          // 1. Si la anomalía seleccionada está en otra página, cambiamos a esa página
          this.paginator.pageIndex = page - 1;
          this.dataSource.paginator = this.paginator;
          resolve(true);
        })
          .then(() => {
            // 2. Expandimos la fila de la anomalía seleccionada (expandimos primero ya que es lo que
            // mejor experiencia ofrece)
            // let row = this.findRow();
            // this.expandRow(row);
            this.scrollToIndex(firstRowInPage.id, false);
            return new Promise((resolve) => {
              setTimeout(() => resolve(true), 200);
            });
          })
          .then(() => {
            // 3. Hacemos scroll hasta la primera fila de la página (de este modo evitamos el efecto de
            // que la fila seleccionada no se vea porque se "ha ido hacia arriba" siguiendo el efecto que
            // hace mat-table al hacer scroll)
            let row = this.findRow();
            this.expandRow(row);
            return new Promise((resolve) => {
              setTimeout(() => resolve(true), 200);
            });
            // this.scrollToIndex(firstRowInPage.id, false);
          })
          .then(() => {
            // Hacemos scroll hasta la fila seleccionada
            this.rowId = this.anomaliaSelected.id;
            this.scrollToIndex(this.rowId, true);
          });
      } else {
        // Si la anomalía seleccionada está en la misma página que la que se está mostrando:
        let row = this.findRow();
        this.expandRow(row);
        // Si la selección se ha hecho desde el mapa, hacemos también el efecto scroll; Si se
        // ha hecho desde la tabla, no queremos que se haga el scroll para evitar mala experiencia
        // de usuario.
        if (this.anomaliasControlService.selectionMethod == 'map') {
          await new Promise((resolve) => {
            resolve(true);
          })
            .then(() => {
              this.scrollToIndex(firstRowInPage.id, false);
              return new Promise((resolve) => {
                setTimeout(() => resolve(true), 200);
              });
            })
            .then(() => {
              this.rowId = this.anomaliaSelected.id;
              this.scrollToIndex(this.rowId, true);
            });
        }
      }
    }
  }

  private scrollToIndex(id: string, smooth?: boolean): void {
    let elem = this.rows.find((row) => row.nativeElement.id === id.toString());
    let target = elem?.nativeElement;
    // let distanceToTop = target.getBoundingClientRect().top;
    if (smooth) {
      target.scrollIntoView({ block: 'start', behavior: 'smooth' });
    } else {
      target.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
  }

  findPage(): Page {
    var sortCol = this.sort.active;
    var sortDir = this.sort.direction;
    var sortedData = this.dataSource.data.sort((a, b) => {
      if (sortDir == 'asc') {
        return a[sortCol] - b[sortCol];
      } else {
        return b[sortCol] - a[sortCol];
      }
    });
    var pageSize = this.paginator.pageSize;
    var anomIndexInSortedData = sortedData.findIndex((x) => x.id == this.anomaliaSelected.id);
    var page = Math.floor(anomIndexInSortedData / pageSize) + 1;
    var firstRowInPage = sortedData[(page - 1) * pageSize];
    return { page, firstRowInPage };
  }

  findRow(): any {
    let row = this.dataSource.data.filter((x) => x.id == this.anomaliaSelected.id);
    return row[0];
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
    if (this.expandedRow === row) {
      this.expandedRow = null;
    }
    row.zoom = zoom;
    this.rowSelected.emit(row);
  }

  expandRow(row: any) {
    this.expandedRow = this.expandedRow === row ? null : row;
  }
}
