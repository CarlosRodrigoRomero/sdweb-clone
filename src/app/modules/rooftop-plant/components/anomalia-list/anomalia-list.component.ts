import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ElementRef, 
  QueryList, 
  ViewChildren
} from '@angular/core';

import {animate, state, style, transition, trigger} from '@angular/animations';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatRow } from '@angular/material/table';

import { Anomalia } from '@core/models/anomalia';

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

  async ngOnChanges(changes: SimpleChanges): Promise<void> {

    if (changes.dataSource && changes.dataSource.currentValue) {
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.rowId = this.anomaliaSelected.id;
      this.scrollTo();
    }
    if (changes.anomaliaSelected && changes.anomaliaSelected.currentValue) {
      var page = this.findPage()
      // console.log("Cambio: ", changes.anomaliaSelected);
      if (this.paginator.pageIndex != page - 1){
        // console.log("Antes de cambiar de página: ");
        this.paginator.pageIndex = page - 1;
        this.dataSource.paginator = this.paginator;
        // console.log("Después de cambiar de página: ");
        await new Promise(resolve => setTimeout(resolve, 1600));
        console.log("After awaiting");
      }
      this.rowId = this.anomaliaSelected.id;
      console.log("Before Scrolling");
      this.scrollTo();
      let row = this.findRow();
      console.log("Before Expanding");
      this.expandRow(row);
      console.log("After Expanding");
      // console.log("This is the row", row);
      // this.expandedRow = this.expandedRow === row ? null : row; 
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
    console.log(distanceToTop)
    if ((distanceToTop > 400) || (distanceToTop < 0)){
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }  
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
    console.log(this.expandedRow === row);
    this.expandedRow = this.expandedRow === row ? null : row;
  }

}
