import { Component, Input, OnInit } from '@angular/core';

import { ComentariosService } from '@data/services/comentarios.service';

import { Comentario } from '@core/models/comentario';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.css'],
})
export class CommentComponent implements OnInit {
  @Input() comentario: Comentario;

  constructor(private comentariosService: ComentariosService) {}

  ngOnInit(): void {}

  deleteComentario() {
    this.comentariosService.deleteComentario(this.comentario.id);
  }
}
