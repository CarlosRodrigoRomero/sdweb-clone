import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { MapSeguidoresService } from '../../services/map-seguidores.service';
import { FilterService } from '@core/services/filter.service';
import { ReportControlService } from '@core/services/report-control.service';
import { SeguidoresControlService } from '../../services/seguidores-control.service';
import { PlantaService } from '@core/services/planta.service';

import { Seguidor } from '@core/models/seguidor';
import { PlantaInterface } from '@core/models/planta';

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
  public seguidorHovered: Seguidor = undefined;
  public seguidorSelected: Seguidor = undefined;
  private planta: PlantaInterface;
  private informeId: string;

  private subscriptions: Subscription = new Subscription();

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private mapSeguidoresService: MapSeguidoresService,
    public filterService: FilterService,
    private reportControlService: ReportControlService,
    private seguidoresControlService: SeguidoresControlService,
    private plantaService: PlantaService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.mapSeguidoresService.toggleViewSelected$.subscribe((sel) => {
        this.viewSeleccionada = Number(sel);

        // cambiammos la ultima columna con la vista seleccionada
        switch (this.viewSeleccionada) {
          case 0:
            this.displayedColumns = ['id', 'numAnomalias', 'modulo', 'mae'];
            break;
          case 1:
            this.displayedColumns = ['id', 'numAnomalias', 'modulo', 'celsCalientes'];
            break;
          case 2:
            this.displayedColumns = ['id', 'numAnomalias', 'modulo', 'gradiente'];
            break;
        }
      })
    );

    this.subscriptions.add(
      this.plantaService
        .getPlanta(this.reportControlService.plantaId)
        .pipe(
          take(1),
          switchMap((planta) => {
            this.planta = planta;

            return this.reportControlService.selectedInformeId$;
          }),
          switchMap((informeId) => {
            this.informeId = informeId;

            return this.filterService.filteredElements$;
          })
        )
        .subscribe((elems) => {
          const filteredElements = [];

          elems
            .filter((elem) => (elem as Seguidor).informeId === this.informeId)
            .forEach((elem) => {
              const seguidor = elem as Seguidor;

              filteredElements.push({
                // color: this.seguidoresControlService.getColorSeguidorMaeExternal(seguidor.mae),
                id: elem.id.replace((elem as Seguidor).informeId, '').replace(/_/g, ' '),
                numAnomalias: seguidor.anomaliasCliente.length,
                modulo: this.getModuloLabel(elem as Seguidor),
                mae: seguidor.mae,
                celsCalientes: this.getCelsCalientes(seguidor),
                gradiente: seguidor.gradienteNormalizado,
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
      this.seguidoresControlService.setPopupPosition(row.seguidor.featureCoords[0]);
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

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
