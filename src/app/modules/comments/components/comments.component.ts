import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';

import { MatTableDataSource } from '@angular/material/table';

import { Subscription } from 'rxjs';

import { ReportControlService } from '@data/services/report-control.service';
import { ComentariosControlService } from '@data/services/comentarios-control.service';
import { AnomaliaInfoService } from '@data/services/anomalia-info.service';

import { Anomalia } from '@core/models/anomalia';

import { RowAnomData } from './anomalias-list/anomalias-list.component';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.css'],
  providers: [DatePipe],
})
export class CommentsComponent implements OnInit, OnDestroy {
  anomaliaSelected: Anomalia;
  anomaliasLoaded = false;
  listOpened = true;
  infoOpened = false;
  vistaSelected: string;
  private anomsData: RowAnomData[];
  dataSource: MatTableDataSource<RowAnomData>;
  plantaFija: boolean;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private comentariosControlService: ComentariosControlService,
    private datePipe: DatePipe,
    private anomaliaInfoService: AnomaliaInfoService
  ) {}

  ngOnInit(): void {
    this.reportControlService.initService().then((res) => {
      this.anomaliasLoaded = res;

      this.plantaFija = this.reportControlService.plantaFija;

      this.comentariosControlService.dataLoaded = res;

      this.comentariosControlService.initService().then(() => {
        this.comentariosControlService.anomalias$.subscribe((anomalias) => {
          this.anomsData = [];
          anomalias.forEach((anom) => {
            let fechaUltCom = null;
            let horaUltCom = null;
            if (anom.hasOwnProperty('comentarios')) {
              if (anom.comentarios.length > 0) {
                const ultimoComentario = anom.comentarios.sort((a, b) => b.datetime - a.datetime)[0];
                fechaUltCom = this.datePipe.transform(ultimoComentario.datetime, 'dd/MM/yyyy');
                horaUltCom = this.datePipe.transform(ultimoComentario.datetime, 'HH:mm');
              }

              let numComs = anom.comentarios.length;
              if (numComs === 0) {
                numComs = null;
              }

              this.anomsData.push({
                id: anom.id,
                numAnom: anom.numAnom,
                numComs,
                tipo: this.anomaliaInfoService.getTipoLabel(anom),
                localizacion: this.anomaliaInfoService.getLocalizacionReducLabel(
                  anom,
                  this.reportControlService.planta
                ),
                posicion: this.anomaliaInfoService.getPosicionReducLabel(anom),
                fechaUltCom,
                horaUltCom,
                anomalia: anom,
              });
            }
          });

          this.dataSource = new MatTableDataSource(this.anomsData);

          this.dataSource.filterPredicate = (data, filter: string): boolean => data.localizacion.includes(filter);
        });
      });
    });

    this.subscriptions.add(
      this.comentariosControlService.anomaliaSelected$.subscribe((anom) => (this.anomaliaSelected = anom))
    );

    this.subscriptions.add(
      this.comentariosControlService.listOpened$.subscribe((opened) => (this.listOpened = opened))
    );

    this.subscriptions.add(
      this.comentariosControlService.infoOpened$.subscribe((opened) => (this.infoOpened = opened))
    );

    this.subscriptions.add(
      this.comentariosControlService.vistaSelected$.subscribe((vista) => (this.vistaSelected = vista))
    );
  }

  ngOnDestroy(): void {
    this.comentariosControlService.dataLoaded = false;

    this.subscriptions.unsubscribe();
  }
}
