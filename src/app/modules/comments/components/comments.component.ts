import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';

import { MatTableDataSource } from '@angular/material/table';

import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { ReportControlService } from '@data/services/report-control.service';
import { ComentariosControlService } from '@data/services/comentarios-control.service';
import { FilterService } from '@data/services/filter.service';
import { ComentariosService } from '@data/services/comentarios.service';
import { AnomaliaInfoService } from '@data/services/anomalia-info.service';

import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';

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
  private anomalias: Anomalia[];
  private anomsData: RowAnomData[];
  dataSource: MatTableDataSource<RowAnomData>;
  plantaFija: boolean;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private comentariosControlService: ComentariosControlService,
    private filterService: FilterService,
    private comentariosService: ComentariosService,
    private datePipe: DatePipe,
    private anomaliaInfoService: AnomaliaInfoService
  ) {}

  ngOnInit(): void {
    this.reportControlService.initService().then((res) => {
      this.anomaliasLoaded = res;

      this.plantaFija = this.reportControlService.plantaFija;

      this.comentariosControlService.dataLoaded = res;

      this.subscriptions.add(
        this.filterService.filteredElements$
          .pipe(
            switchMap((elems) => {
              this.anomalias = [];
              if (this.plantaFija) {
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
                localizacion: this.anomaliaInfoService.getLocalizacionReducLabel(
                  anom,
                  this.reportControlService.planta
                ),
                posicion: this.anomaliaInfoService.getPosicionReducLabel(anom),
                fechaUltCom,
                horaUltCom,
                anomalia: anom,
              });
            });

            this.dataSource = new MatTableDataSource(this.anomsData);
          })
      );
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
