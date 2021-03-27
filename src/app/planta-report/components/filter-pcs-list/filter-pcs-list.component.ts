import { Component, OnInit, ViewChild } from '@angular/core';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { GLOBAL } from '@core/services/global';
import { FilterService } from '@core/services/filter.service';
import { AnomaliasControlService } from '../../services/anomalias-control.service';
import { ReportControlService } from '@core/services/report-control.service';

import { Anomalia } from '@core/models/anomalia';

@Component({
  selector: 'app-filter-pcs-list',
  templateUrl: './filter-pcs-list.component.html',
  styleUrls: ['./filter-pcs-list.component.css'],
})
export class FilterPcsListComponent implements OnInit {
  displayedColumns: string[] = ['tipo', 'perdidas', 'temp', 'gradiente'];
  dataSource: MatTableDataSource<any>;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    public filterService: FilterService,
    private anomaliasControlService: AnomaliasControlService,
    private reportControlService: ReportControlService
  ) {}

  ngOnInit() {
    this.reportControlService.selectedInformeId$.subscribe((informeId) => {
      this.filterService.filteredElements$.subscribe((elems) => {
        const filteredElements = [];

        elems
          .filter((elem) => (elem as Anomalia).informeId === informeId)
          .forEach((anom) =>
            filteredElements.push({
              id: anom.id,
              tipoLabel: GLOBAL.labels_tipos[anom.tipo],
              tipo: anom.tipo,
              perdidas: anom.perdidas,
              temperaturaMax: anom.temperaturaMax,
              gradienteNormalizado: anom.gradienteNormalizado,
              color: GLOBAL.colores_tipos_hex[anom.tipo],
              clase: anom.clase,
              anomalia: anom,
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

  hoverAnomalia(row: any) {
    if (this.anomaliasControlService.anomaliaSelect === undefined) {
      this.anomaliasControlService.anomaliaHover = row.anomalia;
      this.anomaliasControlService.setExternalStyle(row.id, true);
    }
  }

  unhoverAnomalia(row: any) {
    if (this.anomaliasControlService.anomaliaSelect === undefined) {
      this.anomaliasControlService.anomaliaHover = undefined;
      this.anomaliasControlService.setExternalStyle(row.id, false);
    }
  }

  selectAnomalia(row: any) {
    // this.anomaliasControlService.anomaliaSelect = undefined;
    if (this.anomaliasControlService.prevAnomaliaSelect !== undefined) {
      this.anomaliasControlService.setExternalStyle(this.anomaliasControlService.prevAnomaliaSelect.id, false);
    }
    this.anomaliasControlService.prevAnomaliaSelect = row.anomalia;

    this.anomaliasControlService.anomaliaSelect = row.anomalia;
    this.anomaliasControlService.setExternalStyle(row.id, true);
  }
}
