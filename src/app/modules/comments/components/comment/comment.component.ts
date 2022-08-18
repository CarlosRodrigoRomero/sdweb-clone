import { Component, Input, OnInit } from '@angular/core';

import { ComentariosService } from '@data/services/comentarios.service';
import { ComentariosControlService } from '@data/services/comentarios-control.service';

import { Comentario } from '@core/models/comentario';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.css'],
})
export class CommentComponent implements OnInit {
  @Input() comentario: Comentario;

  constructor(
    private comentariosService: ComentariosService,
    private comentariosControlService: ComentariosControlService
  ) {}

  ngOnInit(): void {}

  deleteComentario() {
    this.comentariosService.deleteComentario(this.comentario.id);

    const anomalia = this.comentariosControlService.anomaliaSelected;

    anomalia.comentarios = anomalia.comentarios.filter((com) => com.id !== this.comentario.id);

    this.comentariosControlService.anomaliaSelected = anomalia;
  }
}
