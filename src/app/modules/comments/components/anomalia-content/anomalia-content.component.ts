import { Component, OnInit } from '@angular/core';

import { ComentariosControlService } from '@data/services/comentarios-control.service';
import { ReportControlService } from '@data/services/report-control.service';

@Component({
  selector: 'app-anomalia-content',
  templateUrl: './anomalia-content.component.html',
  styleUrls: ['./anomalia-content.component.css'],
})
export class AnomaliaContentComponent implements OnInit {
  plantaFija: boolean;

  constructor(
    private comentariosControlService: ComentariosControlService,
    private reportControlService: ReportControlService
  ) {}

  ngOnInit(): void {
    this.plantaFija = this.reportControlService.plantaFija;
  }

  closeInfo() {
    this.comentariosControlService.infoOpened = false;
  }
}
