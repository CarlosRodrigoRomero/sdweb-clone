import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { GLOBAL } from '@core/services/global';
import { FilterService } from '@core/services/filter.service';

interface PcData {
  tipo: string;
  temp: number;
}

@Component({
  selector: 'app-filter-pcs-list',
  templateUrl: './filter-pcs-list.component.html',
  styleUrls: ['./filter-pcs-list.component.css'],
})
export class FilterPcsListComponent implements AfterViewInit {
  displayedColumns: string[] = ['tipo', 'temp'];
  dataSource: MatTableDataSource<PcData>;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(public filterService: FilterService) {
    const filteredPcs = [];
    this.filterService.filteredPcs$.subscribe((pcs) =>
      pcs.forEach((pc) => filteredPcs.push({ tipo: GLOBAL.labels_tipos[pc.tipo], temp: pc.temperaturaMax }))
    );
    this.dataSource = new MatTableDataSource(filteredPcs);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
