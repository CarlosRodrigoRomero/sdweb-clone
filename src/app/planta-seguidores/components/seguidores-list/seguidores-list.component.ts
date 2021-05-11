import { Component, OnInit, ViewChild } from '@angular/core';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { GLOBAL } from '@core/services/global';
import { MapSeguidoresService } from '../../services/map-seguidores.service';
import { FilterService } from '@core/services/filter.service';
import { ReportControlService } from '@core/services/report-control.service';
import { SeguidoresControlService } from '../../services/seguidores-control.service';

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
  displayedColumns: string[] = [];
  dataSource: MatTableDataSource<SeguidorData>;
  public seguidorHovered: Seguidor = undefined;
  public seguidorSelected: Seguidor = undefined;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private mapSeguidoresService: MapSeguidoresService,
    public filterService: FilterService,
    private reportControlService: ReportControlService,
    private seguidoresControlService: SeguidoresControlService
  ) {}

  ngOnInit(): void {
    this.mapSeguidoresService.toggleViewSelected$.subscribe((sel) => {
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
        const filteredElements = [];

        elems
          .filter((elem) => (elem as Seguidor).informeId === informeId)
          .forEach((elem) =>
            filteredElements.push({
              id: elem.id.replace((elem as Seguidor).informeId, '').replace(/_/g, ' '),
              modulo: this.getModuloLabel(elem as Seguidor),
              mae: (elem as Seguidor).mae.toFixed(2),
              perdidas: elem.perdidas.toFixed(2),
              gradiente: elem.gradienteNormalizado,
              color: 'red',
              seguidor: elem as Seguidor,
            })
          );

        this.dataSource = new MatTableDataSource(filteredElements);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      });
    });

    this.seguidoresControlService.seguidorHovered$.subscribe((segHov) => (this.seguidorHovered = segHov));
    this.seguidoresControlService.seguidorSelected$.subscribe((segSel) => (this.seguidorSelected = segSel));
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  hoverSeguidor(row: any) {
    if (this.seguidorSelected === undefined) {
      this.seguidoresControlService.seguidorHovered = row.seguidor;
      // this.anomaliasControlService.setExternalStyle(row.id, true);
    }
  }

  unhoverSeguidor(row: any) {
    if (this.seguidorSelected === undefined) {
      this.seguidoresControlService.seguidorHovered = undefined;
      // this.anomaliasControlService.setExternalStyle(row.id, false);
    }
  }

  selectSeguidor(row: any) {
    // quitamos el hover del seguidor
    this.seguidoresControlService.seguidorHovered = undefined;

    // reiniciamos el estilo al anterior seguidor
    /*  if (this.anomaliasControlService.prevAnomaliaSelect !== undefined) {
      this.anomaliasControlService.setExternalStyle(this.anomaliasControlService.prevAnomaliaSelect.id, false);
    }
    this.anomaliasControlService.prevAnomaliaSelect = row.anomalia; */

    this.seguidoresControlService.seguidorSelected = row.seguidor;
    // this.anomaliasControlService.setExternalStyle(row.id, true);
  }

  getModuloLabel(elem: Seguidor): string {
    let moduloLabel: string;
    if (elem.modulo !== undefined) {
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
    } else {
      moduloLabel = 'Desconocido';
    }

    return moduloLabel;
  }
}
