import { Component, OnInit } from '@angular/core';

import { ComentariosControlService } from '@data/services/comentarios-control.service';

@Component({
  selector: 'app-comments-zone',
  templateUrl: './comments-zone.component.html',
  styleUrls: ['./comments-zone.component.css'],
})
export class CommentsZoneComponent implements OnInit {
  constructor(private comentariosControlService: ComentariosControlService) {}

  ngOnInit(): void {}

  goBack() {
    this.comentariosControlService.sidenavOpened = true;
  }
}
