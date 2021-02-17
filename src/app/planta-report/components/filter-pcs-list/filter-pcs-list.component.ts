import { Component, OnInit, ViewChild } from '@angular/core';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { GLOBAL } from '@core/services/global';
import { FilterService } from '@core/services/filter.service';

interface PcData {
  tipo: string;
  perdidas: number;
  temp: number;
  gradiente: number;
}

@Component({
  selector: 'app-filter-pcs-list',
  templateUrl: './filter-pcs-list.component.html',
  styleUrls: ['./filter-pcs-list.component.css'],
})
export class FilterPcsListComponent implements OnInit {
  displayedColumns: string[] = ['tipo', 'perdidas', 'temp', 'gradiente'];
  dataSource: MatTableDataSource<PcData>;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(public filterService: FilterService) {}

  ngOnInit() {
    this.filterService.filteredElements$.subscribe((elem) => {
      const filteredElements = [];

      elem.forEach((pc) =>
        filteredElements.push({
          tipo: GLOBAL.labels_tipos[pc.tipo],
          perdidas: pc.perdidas * 100,
          temp: pc.temperaturaMax,
          gradiente: pc.gradienteNormalizado,
        })
      );

      this.dataSource = new MatTableDataSource(filteredElements);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
