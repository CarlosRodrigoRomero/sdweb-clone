import { Component, OnInit } from '@angular/core';

import { ComentariosControlService } from '@data/services/comentarios-control.service';

@Component({
  selector: 'app-comments-area',
  templateUrl: './comments-area.component.html',
  styleUrls: ['./comments-area.component.css'],
})
export class CommentsAreaComponent implements OnInit {
  tipoComentario = 'anomalia';

  constructor(private comentariosControlService: ComentariosControlService) {}

  ngOnInit(): void {}

  setTipoComentario(event) {
    this.comentariosControlService.tipoComentarioSelected = event.value;
  }
}
