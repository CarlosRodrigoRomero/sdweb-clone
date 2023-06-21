import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';

import { Subscription, fromEvent, merge, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { ReportControlService } from '@data/services/report-control.service';
import { ComentariosControlService } from '@data/services/comentarios-control.service';
import { AnomaliaInfoService } from '@data/services/anomalia-info.service';
import { ResetServices } from '@data/services/reset-services.service';

import { Anomalia } from '@core/models/anomalia';

import { RowAnomData } from './anomalias-list/anomalias-list.component';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.css'],
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
  networkStatus: boolean;
  networkStatus$: Subscription = Subscription.EMPTY;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private comentariosControlService: ComentariosControlService,
    private anomaliaInfoService: AnomaliaInfoService,
    private resetServices: ResetServices
  ) {}

  ngOnInit(): void {
    // agregamos una entrada en el historial de navegación al cargar la aplicación para poder volver a la página anterior
    window.history.pushState(null, '', window.location.href);

    this.reportControlService.initService().then((res) => {
      this.anomaliasLoaded = res;

      this.plantaFija = this.reportControlService.plantaFija;

      this.comentariosControlService.dataLoaded = res;

      this.comentariosControlService.initService().then(() => {
        this.subscriptions.add(
          this.comentariosControlService.anomalias$.subscribe((anomalias) => {
            this.anomsData = [];
            anomalias.forEach((anom) => {
              let fechaUltCom = null;
              if (anom.hasOwnProperty('comentarios')) {
                if (anom.comentarios.length > 0) {
                  const ultimoComentario = anom.comentarios.sort((a, b) => b.datetime - a.datetime)[0];
                  fechaUltCom = ultimoComentario.datetime;
                }

                let numComs = anom.comentarios.length;
                if (numComs === 0) {
                  numComs = null;
                }

                let estado = 'Pendiente';
                if (anom.hasOwnProperty('status') && anom.status !== '') {
                  estado = anom.status;
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
                  // fechaUltCom,
                  // horaUltCom,
                  anomalia: anom,
                  fecha: fechaUltCom,
                  estado,
                });
              }
            });

            this.dataSource = new MatTableDataSource(this.anomsData);

            this.dataSource.filterPredicate = (data, filter: string): boolean => {
              return data.localizacion.toLowerCase().includes(filter);
            };
          })
        );
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

    // checkeamos las conexiones a internet
    this.checkNetworkStatus();
  }

  // To check internet connection stability
  checkNetworkStatus() {
    this.networkStatus = navigator.onLine;
    this.networkStatus$ = merge(of(null), fromEvent(window, 'online'), fromEvent(window, 'offline'))
      .pipe(map(() => navigator.onLine))
      .subscribe((status) => {
        this.networkStatus = status;
      });
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: PopStateEvent) {
    if (this.listOpened && this.infoOpened) {
      this.comentariosControlService.infoOpened = false;

      // Evita la navegación hacia atrás agregando otra entrada en el historial de navegación
      window.history.pushState(null, '', window.location.href);
    } else if (this.listOpened) {
      this.comentariosControlService.listOpened = false;

      // Evita la navegación hacia atrás agregando otra entrada en el historial de navegación
      window.history.pushState(null, '', window.location.href);
    } else if (this.infoOpened) {
      this.comentariosControlService.infoOpened = false;

      // Evita la navegación hacia atrás agregando otra entrada en el historial de navegación
      window.history.pushState(null, '', window.location.href);
    }

    // Evita la navegación hacia atrás agregando otra entrada en el historial de navegación
    window.history.pushState(null, '', window.location.href);

    // Cancela el evento para evitar la navegación hacia atrás
    event.preventDefault();
  }

  ngOnDestroy(): void {
    this.comentariosControlService.dataLoaded = false;

    this.subscriptions.unsubscribe();

    this.networkStatus$.unsubscribe();

    this.resetServices.resetAllServices();
  }
}
