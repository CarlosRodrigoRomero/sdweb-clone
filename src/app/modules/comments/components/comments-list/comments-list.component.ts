import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';

import { combineLatest, Subscription } from 'rxjs';

import { ComentariosControlService } from '@data/services/comentarios-control.service';

import { Comentario } from '@core/models/comentario';

@Component({
  selector: 'app-comments-list',
  templateUrl: './comments-list.component.html',
  styleUrls: ['./comments-list.component.css'],
})
export class CommentsListComponent implements OnInit, AfterViewInit, OnDestroy {
  comentariosAnomalia: Comentario[];

  private subscriptions: Subscription = new Subscription();

  constructor(private comentariosControlService: ComentariosControlService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      combineLatest([
        this.comentariosControlService.anomaliaSelected$,
        this.comentariosControlService.tipoComentarioSelected$,
      ]).subscribe(([anomalia, tipo]) => {
        if (anomalia) {
          if (anomalia.hasOwnProperty('comentarios') && anomalia.comentarios.length > 0) {
            const comentarios = anomalia.comentarios;

            // filtramos por tipo y  ordenamos de más reciente a más antiguo
            this.comentariosAnomalia = comentarios
              .filter((com) => com.tipo === tipo)
              .sort((a, b) => b.datetime - a.datetime);
          } else {
            this.comentariosAnomalia = [];
          }
        }
      })
    );
  }

  ngAfterViewInit(): void {
    const element = document.getElementById('comentarios');
    if (element) {
      element.style.height = window.innerHeight - 616 + 'px';
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
