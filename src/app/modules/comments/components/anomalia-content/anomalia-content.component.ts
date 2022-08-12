import { Component, OnInit } from '@angular/core';

import { ComentariosControlService } from '@data/services/comentarios-control.service';

@Component({
  selector: 'app-anomalia-content',
  templateUrl: './anomalia-content.component.html',
  styleUrls: ['./anomalia-content.component.css'],
})
export class AnomaliaContentComponent implements OnInit {
  constructor(private comentariosControlService: ComentariosControlService) {}

  ngOnInit(): void {}

  closeInfo() {
    this.comentariosControlService.infoOpened = false;
  }
}
