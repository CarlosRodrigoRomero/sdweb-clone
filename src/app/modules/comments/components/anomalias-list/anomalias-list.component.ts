import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';

import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';

import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { FilterService } from '@data/services/filter.service';
import { ReportControlService } from '@data/services/report-control.service';
import { AnomaliaInfoService } from '@data/services/anomalia-info.service';
import { ComentariosControlService } from '@data/services/comentarios-control.service';
import { ComentariosService } from '@data/services/comentarios.service';
import { OlMapService } from '@data/services/ol-map.service';
import { AnomaliasControlService } from '@data/services/anomalias-control.service';

import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';

interface RowAnomData {
  id: string;
  numAnom: number;
  numComs: number;
  tipo: string;
  localizacion: string;
  posicion: string;
  fechaUltCom?: string;
  horaUltCom?: string;
  anomalia?: Anomalia;
}

@Component({
  selector: 'app-anomalias-list',
  templateUrl: './anomalias-list.component.html',
  styleUrls: ['./anomalias-list.component.css'],
  providers: [DatePipe],
})
export class AnomaliasListComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort) sort: MatSort;
  dataSource: MatTableDataSource<RowAnomData>;
  private anomalias: Anomalia[];
  private anomsData: RowAnomData[];
  displayedColumns: string[] = ['numAnom', 'tipo', 'localizacion', 'fecha', 'map', 'numComs'];
  anomaliaSelected: Anomalia;
  headerLocLabel = '';

  private subscriptions: Subscription = new Subscription();

  constructor(
    private filterService: FilterService,
    private reportControlService: ReportControlService,
    private anomaliaInfoService: AnomaliaInfoService,
    private comentariosControlService: ComentariosControlService,
    private comentariosService: ComentariosService,
    private datePipe: DatePipe,
    private olMapService: OlMapService,
    private anomaliasControlService: AnomaliasControlService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.filterService.filteredElements$
        .pipe(
          switchMap((elems) => {
            this.anomalias = [];
            if (this.reportControlService.plantaFija) {
              this.anomalias = elems as Anomalia[];
            } else {
              elems.forEach((seg) => this.anomalias.push(...(seg as Seguidor).anomaliasCliente));
            }

            this.comentariosControlService.anomaliaSelected = this.anomalias[0];

            return this.comentariosService.getComentariosInforme(this.anomalias[0].informeId);
          })
        )
        .subscribe((comentarios) => {
          this.anomsData = [];
          this.anomalias.forEach((anom) => {
            const comentariosAnom = comentarios.filter((com) => com.anomaliaId === anom.id);
            let fechaUltCom = null;
            let horaUltCom = null;
            if (comentariosAnom.length > 0) {
              const ultimoComentario = comentariosAnom.sort((a, b) => b.datetime - a.datetime)[0];
              fechaUltCom = this.datePipe.transform(ultimoComentario.datetime, 'dd/MM/yyyy');
              horaUltCom = this.datePipe.transform(ultimoComentario.datetime, 'HH:mm');
            }

            let numComs = comentariosAnom.length;
            if (numComs === 0) {
              numComs = null;
            }

            this.anomsData.push({
              id: anom.id,
              numAnom: anom.numAnom,
              numComs,
              tipo: this.anomaliaInfoService.getTipoLabel(anom),
              localizacion: this.anomaliaInfoService.getLocalizacionReducLabel(anom, this.reportControlService.planta),
              posicion: this.anomaliaInfoService.getPosicionReducLabel(anom),
              fechaUltCom,
              horaUltCom,
              anomalia: anom,
            });
          });

          this.dataSource = new MatTableDataSource(this.anomsData);
          this.dataSource.sort = this.sort;
        })
    );

    this.subscriptions.add(
      this.comentariosControlService.anomaliaSelected$.subscribe((anom) => (this.anomaliaSelected = anom))
    );

    if (this.reportControlService.planta.hasOwnProperty('nombreGlobalCoords')) {
      this.headerLocLabel = '(' + this.reportControlService.planta.nombreGlobalCoords.join('.') + ')';
    }
  }

  selectAnomalia(row: any) {
    this.openInfo();

    // seleccionamos la anomalia
    this.comentariosControlService.anomaliaSelected = this.anomalias.find((anom) => anom.id === row.id);
  }

  openInfo() {
    this.comentariosControlService.infoOpened = true;
  }

  closeListAndInfo() {
    this.comentariosControlService.listOpened = false;
    this.comentariosControlService.infoOpened = false;

    // this.comentariosControlService.vistaSelected = 'map';
  }

  goToAnomMap(anomalia: Anomalia) {
    this.comentariosControlService.anomaliaSelected = anomalia;

    this.olMapService.setViewCenter(anomalia.featureCoords[0]);
    this.olMapService.setViewZoom(this.anomaliasControlService.zoomChangeView);

    this.closeListAndInfo();
  }

  private closeSidenav() {
    // cerramos el sidenav si estamos en mobile
    if (window.screen.width < 768) {
      this.comentariosControlService.listOpened = false;
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
