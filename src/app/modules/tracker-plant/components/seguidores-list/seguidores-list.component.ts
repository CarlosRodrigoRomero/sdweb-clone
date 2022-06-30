import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { FilterService } from '@data/services/filter.service';
import { ReportControlService } from '@data/services/report-control.service';
import { SeguidoresControlService } from '@data/services/seguidores-control.service';
import { ViewReportService } from '@data/services/view-report.service';

import { Seguidor } from '@core/models/seguidor';

import { COLOR } from '@data/constants/color';

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
export class SeguidoresListComponent implements OnInit, AfterViewInit, OnDestroy {
  viewSeleccionada = 0;
  displayedColumns: string[] = [];
  dataSource: MatTableDataSource<SeguidorData>;
  seguidorHovered: Seguidor = undefined;
  seguidorSelected: Seguidor = undefined;
  private selectedInformeId: string;

  private subscriptions: Subscription = new Subscription();

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    public filterService: FilterService,
    private reportControlService: ReportControlService,
    private seguidoresControlService: SeguidoresControlService,
    private viewReportService: ViewReportService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.viewReportService.reportViewSelected$.subscribe((sel) => {
        this.viewSeleccionada = Number(sel);

        // cambiammos la ultima columna con la vista seleccionada
        switch (this.viewSeleccionada) {
          case 0:
            this.displayedColumns = ['colors', 'nombre', 'numAnomalias', 'modulo', 'mae'];
            break;
          case 1:
            this.displayedColumns = ['colors', 'nombre', 'numAnomalias', 'modulo', 'celsCalientes'];
            break;
          case 2:
            this.displayedColumns = ['colors', 'nombre', 'numAnomalias', 'modulo', 'gradiente'];
            break;
        }
      })
    );

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$
        .pipe(
          switchMap((informeId) => {
            this.selectedInformeId = informeId;

            return this.filterService.filteredElements$;
          })
        )
        .subscribe((elems) => {
          const filteredElements = [];

          elems
            .filter((elem) => (elem as Seguidor).informeId === this.selectedInformeId)
            .forEach((elem) => {
              const seguidor = elem as Seguidor;

              filteredElements.push({
                nombre: seguidor.nombre,
                numAnomalias: seguidor.anomaliasCliente.length,
                modulo: seguidor.moduloLabel,
                mae: seguidor.mae,
                celsCalientes: seguidor.celsCalientes,
                gradiente: seguidor.gradienteNormalizado,
                colors: this.getColorsViewSeguidor(seguidor),
                seguidor,
              });
            });

          this.dataSource = new MatTableDataSource(filteredElements);
          this.dataSource.sort = this.sort;
        })
    );

    this.subscriptions.add(
      this.seguidoresControlService.seguidorHovered$.subscribe((segHov) => (this.seguidorHovered = segHov))
    );
    this.subscriptions.add(
      this.seguidoresControlService.seguidorSelected$.subscribe((segSel) => (this.seguidorSelected = segSel))
    );
  }

  ngAfterViewInit(): void {
    if (this.dataSource !== undefined) {
      this.dataSource.sort = this.sort;
    }
  }

  private getColorsViewSeguidor(seguidor: Seguidor): string[] {
    let colors: string[] = [];
    if (seguidor.anomaliasCliente.length > 0) {
      const colorMae = this.seguidoresControlService.getColorSeguidorMae(seguidor.mae, 1);
      const colorCCs = this.seguidoresControlService.getColorSeguidorGradienteNormMax(seguidor.gradienteNormalizado, 1);
      const colorGradNormMax = this.seguidoresControlService.getColorSeguidorGradienteNormMax(
        seguidor.gradienteNormalizado,
        1
      );

      colors = [colorMae, colorCCs, colorGradNormMax];
    } else {
      colors = [COLOR.color_no_anoms, COLOR.color_no_anoms, COLOR.color_no_anoms];
    }

    return colors;
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
      this.seguidoresControlService.setExternalStyleSeguidor(row.seguidor.id, true);
      this.seguidoresControlService.setPopupPosition(row.seguidor.featureCoords[0]);
    }
  }

  unhoverSeguidor(row: any) {
    if (this.seguidorSelected === undefined) {
      this.seguidoresControlService.seguidorHovered = undefined;
      this.seguidoresControlService.setExternalStyleSeguidor(row.seguidor.id, false);
    }
  }

  selectSeguidor(row: any) {
    // quitamos el hover del seguidor
    this.seguidoresControlService.seguidorHovered = undefined;

    // reiniciamos el estilo al anterior seguidor
    if (this.seguidoresControlService.prevSeguidorSelected !== undefined) {
      this.seguidoresControlService.setExternalStyleSeguidor(
        this.seguidoresControlService.prevSeguidorSelected.id,
        false
      );
    }
    this.seguidoresControlService.prevSeguidorSelected = row.seguidor;

    this.seguidoresControlService.seguidorSelected = row.seguidor;
    this.seguidoresControlService.setExternalStyleSeguidor(row.seguidor.id, false);
    this.seguidoresControlService.seguidorViewOpened = true;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
