import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { ComentariosService } from '@data/services/comentarios.service';
import { ComentariosControlService } from '@data/services/comentarios-control.service';

import { Comentario } from '@core/models/comentario';

@Component({
  selector: 'app-comments-list',
  templateUrl: './comments-list.component.html',
  styleUrls: ['./comments-list.component.css'],
})
export class CommentsListComponent implements OnInit, OnDestroy {
  comentariosAnomalia: Comentario[];

  private subscriptions: Subscription = new Subscription();

  constructor(
    private comentariosService: ComentariosService,
    private comentariosControlService: ComentariosControlService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.comentariosControlService.anomaliaSelected$
        .pipe(switchMap((anom) => this.comentariosService.getComentariosAnomalia(anom.id)))
        .subscribe((coments) => {
          this.comentariosAnomalia = coments;

          // los ordenamos de más reciente a más antiguo
          this.comentariosAnomalia = this.comentariosAnomalia.sort((a, b) => a.datetime - b.datetime);
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
