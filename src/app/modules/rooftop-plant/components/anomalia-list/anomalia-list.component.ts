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
  ViewChildren
} from '@angular/core';

import { from } from 'rxjs';
import { concatMap } from 'rxjs/operators';

import {animate, state, style, transition, trigger} from '@angular/animations';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatRow } from '@angular/material/table';

import { Anomalia } from '@core/models/anomalia';

import { AnomaliasControlService } from '@data/services/anomalias-control.service';

@Component({
  selector: 'app-anomalia-list',
  templateUrl: './anomalia-list.component.html',
  styleUrls: ['./anomalia-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
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
  // For allowing the table to scroll to the selected anomalie
  @ViewChildren(MatRow, { read: ElementRef }) rows!: QueryList<
    ElementRef<HTMLTableRowElement>
  >;
  expandedRow: Anomalia | null;
  selectedRowId: string;
  rowId: string;

  displayedColumns: string[] = ['colors', 'numAnom', 'tipo', 'perdidas', 'comentarios'];

  constructor(private anomaliasControlService: AnomaliasControlService) {}

  async ngOnChanges(changes: SimpleChanges): Promise<void> {

    if (changes.dataSource && changes.dataSource.currentValue) {
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    }
    // Si seleccionamos una anomalía debemos cambiar a la página de la tabla para mostrar la anomalía correcta.
    if (changes.anomaliaSelected && changes.anomaliaSelected.currentValue) {

      await new Promise(resolve => {
        var page = this.findPage()
        if (this.paginator.pageIndex != page - 1){
          this.paginator.pageIndex = page - 1;
          this.dataSource.paginator = this.paginator;
          // Esperamos 1.6 segundos antes de hacer scroll para que la tabla se cargue
          // Si se produce cambio de página, hacemos scroll instantáneo al principio de la tabla para que 
          // se produzca el efecto visual de hacer scroll a la anomalía. Si no, hay veces que no se ve el efecto
          // porque la anomalía está en la misma posición en otra página.
          // document.getElementById("table-anomalias").scrollTo({ top: 0, left: 0});
          resolve(true);
          // setTimeout(resolve, 1000);
        } else {
          resolve(false);
        }
        // setTimeout(resolve, 1000)
      }).then((value: boolean) => {
        console.log("El valor es: ", value)
        // console.log("Scroll");
        // return new Promise(resolve => {
        //   this.rowId = this.anomaliaSelected.id;
        //   // console.log(this.anomaliaSelected);
        //   this.scrollToIndex(this.rowId);
        //   resolve(1);
        // })

        let row = this.findRow();
        this.expandRow(row);

      }).then(() => {
        
        // El cambio en la snomalía seleccionada se detecta no sólo cuando seleccionamos una anomalía en el mapa, sino también
        // si se selecciona en la lista. 
        // let row = this.findRow();
        // this.expandRow(row);
        // console.log("Expand");

        this.rowId = this.anomaliaSelected.id;
        this.scrollTo();
      }) ;
    }
  }

  scrollTo(): void {
    this.scrollToIndex(this.rowId);
  }

  private scrollToIndex(id: string): void {
    this.selectedRowId = id;
    let elem = this.rows.find((row) => row.nativeElement.id === id.toString());
    let target = elem?.nativeElement;
    let distanceToTop = target.getBoundingClientRect().top;
    document.getElementById("table-anomalias").scrollTo({ top: 0, left: 0});
    target.scrollIntoView({ block: 'start', behavior: 'smooth' });
    // if ((distanceToTop > 400) || (distanceToTop < 0)){
    //   target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    // }  
  }

  findPage(): number {
    var sortCol = this.sort.active
    var sortDir = this.sort.direction
    var sortedData = this.dataSource.data.sort((a, b) => {
      if (sortDir == 'asc'){
        return a[sortCol] - b[sortCol]
      } else {
        return b[sortCol] - a[sortCol]
      }
    });
    var pageSize = this.paginator.pageSize;
    var anomIndexInSortedData = sortedData.findIndex(x => x.id == this.anomaliaSelected.id);
    var page = Math.floor(anomIndexInSortedData / pageSize) + 1;
    return page
  }

  findRow(): any{
    let row = this.dataSource.data.filter(x => x.id == this.anomaliaSelected.id);
    return row[0]
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
    if (this.expandedRow === row){
      this.expandedRow = null;
    }
    row.zoom = zoom;
    this.rowSelected.emit(row);
  }

  expandRow(row: any) {
    this.expandedRow = this.expandedRow === row ? null : row;
    console.log("Parece que se ha expandido");
  }

}
