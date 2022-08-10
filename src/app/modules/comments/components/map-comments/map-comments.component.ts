import { Component, OnInit } from '@angular/core';

import { ComentariosControlService } from '@data/services/comentarios-control.service';

@Component({
  selector: 'app-map-comments',
  templateUrl: './map-comments.component.html',
  styleUrls: ['./map-comments.component.css'],
})
export class MapCommentsComponent implements OnInit {
  constructor(private comentariosControlService: ComentariosControlService) {}

  ngOnInit(): void {}

  selectVistaList() {
    this.comentariosControlService.vistaSelected = 'list';
  }
}
