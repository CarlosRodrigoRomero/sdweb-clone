import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';

import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { MapSeguidoresService } from '../../services/map-seguidores.service';
import { FilterService } from '@core/services/filter.service';
import { ReportControlService } from '@core/services/report-control.service';
import { SeguidoresControlService } from '../../services/seguidores-control.service';
import { PlantaService } from '@core/services/planta.service';

import { Seguidor } from '@core/models/seguidor';
import { PlantaInterface } from '@core/models/planta';
import { combineLatest } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

interface SeguidorData {
  id: string;
  modulo: string;
  mae?: number;
  celsCalientes?: number;
  gradiente?: number;
  color?: string;
}

@Component({
  selector: 'app-seguidores-list',
  templateUrl: './seguidores-list.component.html',
  styleUrls: ['./seguidores-list.component.css'],
})
export class SeguidoresListComponent implements OnInit, AfterViewInit {
  viewSeleccionada = 0;
  displayedColumns: string[] = [];
  dataSource: MatTableDataSource<SeguidorData>;
  public seguidorHovered: Seguidor = undefined;
  public seguidorSelected: Seguidor = undefined;
  private planta: PlantaInterface;
  private informeId: string;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private mapSeguidoresService: MapSeguidoresService,
    public filterService: FilterService,
    private reportControlService: ReportControlService,
    private seguidoresControlService: SeguidoresControlService,
    private plantaService: PlantaService
  ) {}

  ngOnInit(): void {
    this.mapSeguidoresService.toggleViewSelected$.subscribe((sel) => {
      this.viewSeleccionada = Number(sel);

      // cambiammos la ultima columna con la vista seleccionada
      switch (this.viewSeleccionada) {
        case 0:
          this.displayedColumns = ['id', 'anomalias', 'modulo', 'mae'];
          break;
        case 1:
          this.displayedColumns = ['id', 'anomalias', 'modulo', 'celsCalientes'];
          break;
        case 2:
          this.displayedColumns = ['id', 'anomalias', 'modulo', 'gradiente'];
          break;
      }
    });

    const getPlanta$ = this.plantaService.getPlanta(this.reportControlService.plantaId);
    const getInformeId$ = this.reportControlService.selectedInformeId$;

    combineLatest([getPlanta$, getInformeId$])
      .pipe(
        take(1),
        switchMap(([planta, informeId]) => {
          this.planta = planta;
          this.informeId = informeId;

          return this.filterService.filteredElements$;
        })
      )
      .subscribe((elems) => {
        const filteredElements = [];

        elems
          .filter((elem) => (elem as Seguidor).informeId === this.informeId)
          .forEach((elem) =>
            filteredElements.push({
              id: elem.id.replace((elem as Seguidor).informeId, '').replace(/_/g, ' '),
              modulo: this.getModuloLabel(elem as Seguidor),
              celsCalientes: this.getCelsCalientes(elem as Seguidor),
              color: 'red',
              // numAnomalias: (elem as Seguidor).anomalias.filter((anom) => anom.tipo != 0).length,
              seguidor: elem as Seguidor,
            })
          );

        this.dataSource = new MatTableDataSource(filteredElements);
        this.dataSource.sort = this.sort;
      });

    this.seguidoresControlService.seguidorHovered$.subscribe((segHov) => (this.seguidorHovered = segHov));
    this.seguidoresControlService.seguidorSelected$.subscribe((segSel) => (this.seguidorSelected = segSel));
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
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
      this.seguidoresControlService.setExternalStyle(row.seguidor.id, true);
    }
  }

  unhoverSeguidor(row: any) {
    if (this.seguidorSelected === undefined) {
      this.seguidoresControlService.seguidorHovered = undefined;
      this.seguidoresControlService.setExternalStyle(row.seguidor.id, false);
    }
  }

  selectSeguidor(row: any) {
    // quitamos el hover del seguidor
    this.seguidoresControlService.seguidorHovered = undefined;

    // reiniciamos el estilo al anterior seguidor
    if (this.seguidoresControlService.prevSeguidorSelected !== undefined) {
      this.seguidoresControlService.setExternalStyle(this.seguidoresControlService.prevSeguidorSelected.id, false);
    }
    this.seguidoresControlService.prevSeguidorSelected = row.seguidor;

    this.seguidoresControlService.seguidorSelected = row.seguidor;
    this.seguidoresControlService.setExternalStyle(row.seguidor.id, true);
    this.seguidoresControlService.seguidorViewOpened = true;
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

  getCelsCalientes(seguidor: Seguidor): number {
    // tslint:disable-next-line: triple-equals
    const celsCalientes = seguidor.anomalias.filter((anom) => anom.tipo == 8 || anom.tipo == 9);

    return celsCalientes.length / (this.planta.filas * this.planta.columnas);
  }
}
