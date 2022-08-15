import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';

import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';

import { Subscription } from 'rxjs';

import { ReportControlService } from '@data/services/report-control.service';
import { ComentariosControlService } from '@data/services/comentarios-control.service';
import { OlMapService } from '@data/services/ol-map.service';
import { AnomaliasControlService } from '@data/services/anomalias-control.service';

import { Anomalia } from '@core/models/anomalia';

export interface RowAnomData {
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnomaliasListComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() dataSource: MatTableDataSource<RowAnomData>;
  @Input() anomalias: Anomalia[];
  @Input() anomsData: RowAnomData[];
  @Input() anomaliaSelected: Anomalia;
  displayedColumns: string[] = ['numAnom', 'tipo', 'localizacion', 'fecha', 'numComs', 'map'];
  headerLocLabel = '';

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private comentariosControlService: ComentariosControlService,
    private olMapService: OlMapService,
    private anomaliasControlService: AnomaliasControlService
  ) {}

  ngOnInit(): void {
    if (this.reportControlService.planta.hasOwnProperty('nombreGlobalCoords')) {
      this.headerLocLabel = '(' + this.reportControlService.planta.nombreGlobalCoords.join('.') + ')';
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty('anomaliaSelected')) {
      this.anomaliaSelected = changes.anomaliaSelected.currentValue;
    }
    if (changes.hasOwnProperty('anomalias')) {
      this.anomalias = changes.anomalias.currentValue;
    }
    if (changes.hasOwnProperty('dataSource') && changes.dataSource.currentValue != undefined) {
      this.dataSource = changes.dataSource.currentValue;
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
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
