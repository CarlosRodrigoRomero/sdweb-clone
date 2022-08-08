import { Component, OnInit, ViewChild } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';

import { FilterService } from '@data/services/filter.service';
import { ReportControlService } from '@data/services/report-control.service';
import { AnomaliaInfoService } from '@data/services/anomalia-info.service';
import { ComentariosControlService } from '@data/services/comentarios-control.service';

import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';

interface RowAnomData {
  id: string;
  numAnom: number;
  tipo: string;
  localizacion: string;
}

@Component({
  selector: 'app-anomalias-list',
  templateUrl: './anomalias-list.component.html',
  styleUrls: ['./anomalias-list.component.css'],
})
export class AnomaliasListComponent implements OnInit {
  @ViewChild(MatSort) sort: MatSort;
  dataSource: MatTableDataSource<RowAnomData>;
  private anomalias: Anomalia[];
  private anomsData: RowAnomData[];
  displayedColumns: string[] = ['numAnom', 'tipo', 'localizacion'];

  constructor(
    private filterService: FilterService,
    private reportControlService: ReportControlService,
    private anomaliaInfoService: AnomaliaInfoService,
    private comentariosControlService: ComentariosControlService
  ) {}

  ngOnInit(): void {
    this.filterService.filteredElements$.subscribe((elems) => {
      this.anomalias = [];
      if (this.reportControlService.plantaFija) {
        this.anomalias = elems as Anomalia[];
      } else {
        elems.forEach((seg) => this.anomalias.push(...(seg as Seguidor).anomaliasCliente));
      }

      this.anomsData = [];
      this.anomalias.forEach((anom) => {
        this.anomsData.push({
          id: anom.id,
          numAnom: anom.numAnom,
          tipo: this.anomaliaInfoService.getTipoLabel(anom),
          localizacion: this.anomaliaInfoService.getLocalizacionCompleteLabel(anom, this.reportControlService.planta),
        });
      });

      this.dataSource = new MatTableDataSource(this.anomsData);
      this.dataSource.sort = this.sort;
    });
  }

  selectAnomalia(row: any) {
    // cerramos el sidenav
    this.comentariosControlService.sidenavOpened = false;

    // seleccionamos la anomalia
    this.comentariosControlService.anomaliaSelected = this.anomalias.find((anom) => anom.id === row.id);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
