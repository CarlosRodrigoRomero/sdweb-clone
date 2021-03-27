import { Component, OnInit, ViewChild } from '@angular/core';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { GLOBAL } from '@core/services/global';
import { MapSeguidoresService } from '../../services/map-seguidores.service';
import { FilterService } from '@core/services/filter.service';
import { ReportControlService } from '@core/services/report-control.service';

import { Seguidor } from '@core/models/seguidor';

interface SeguidorData {
  id: string;
  modulo: string;
  mae?: number;
  perdidas?: number;
  gradiente?: number;
  color?: string;
}

@Component({
  selector: 'app-seguidores-list',
  templateUrl: './seguidores-list.component.html',
  styleUrls: ['./seguidores-list.component.css'],
})
export class SeguidoresListComponent implements OnInit {
  viewSeleccionada = 0;
  displayedColumns: string[] = ['id', 'modulo', 'mae'];
  dataSource: MatTableDataSource<SeguidorData>;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private mapSeguidoresService: MapSeguidoresService,
    public filterService: FilterService,
    private reportControlService: ReportControlService
  ) {}

  ngOnInit(): void {
    this.mapSeguidoresService.toggleView$.subscribe((sel) => {
      this.viewSeleccionada = Number(sel);

      // cambiammos la ultima columna con la vista seleccionada
      switch (this.viewSeleccionada) {
        case 0:
          this.displayedColumns = ['id', 'modulo', 'mae'];
          break;
        case 1:
          this.displayedColumns = ['id', 'modulo', 'perdidas'];
          break;
        case 2:
          this.displayedColumns = ['id', 'modulo', 'gradiente'];
          break;
      }
    });

    this.reportControlService.selectedInformeId$.subscribe((informeId) => {
      this.filterService.filteredElements$.subscribe((elems) => {
        console.log(elems);

        const filteredElements = [];

        elems
          .filter((elem) => (elem as Seguidor).informeId === informeId)
          .forEach((elem) =>
            filteredElements.push({
              id: elem.id.replace((elem as Seguidor).informeId, ''),
              modulo: this.getModuloLabel(elem as Seguidor),
              mae: (elem as Seguidor).mae.toFixed(2),
              perdidas: elem.perdidas,
              gradiente: elem.gradienteNormalizado,
              color: 'red',
            })
          );

        this.dataSource = new MatTableDataSource(filteredElements);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      });
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getModuloLabel(elem: Seguidor): string {
    let moduloLabel: string;
    if (elem.modulo.marca === undefined) {
      if (elem.modulo.modelo === undefined) {
        moduloLabel = elem.modulo.potencia + 'W';
      } else {
        moduloLabel = elem.modulo.modelo + ' ' + elem.modulo.potencia + 'W';
      }
    } else {
      if (elem.modulo.modelo === undefined) {
        moduloLabel = elem.modulo.marca + ' ' + elem.modulo.potencia + 'W';
      } else {
        moduloLabel = elem.modulo.marca + ' ' + elem.modulo.modelo + ' ' + elem.modulo.potencia + 'W';
      }
    }
    return moduloLabel;
  }
}
