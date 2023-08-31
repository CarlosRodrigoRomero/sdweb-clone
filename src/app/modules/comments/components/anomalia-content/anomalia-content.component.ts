import { AfterViewInit, Component, OnInit } from '@angular/core';

import { ComentariosControlService } from '@data/services/comentarios-control.service';
import { ReportControlService } from '@data/services/report-control.service';
import { SeguidorViewCommentsService } from '@data/services/seguidor-view-comments.service';

@Component({
  selector: 'app-anomalia-content',
  templateUrl: './anomalia-content.component.html',
  styleUrls: ['./anomalia-content.component.css'],
})
export class AnomaliaContentComponent implements OnInit, AfterViewInit {
  plantaFija: boolean;

  constructor(
    private comentariosControlService: ComentariosControlService,
    private reportControlService: ReportControlService,
    private seguidorViewCommentsService: SeguidorViewCommentsService
  ) {}

  ngOnInit(): void {
    this.plantaFija = this.reportControlService.plantaNoS2E;
  }

  ngAfterViewInit(): void {
    if (!this.reportControlService.plantaNoS2E) {
      const htmlView = document.getElementById('anomalia-content');
      htmlView.style.marginTop = this.seguidorViewCommentsService.imagesHeight - 60 + 'px';
    }
  }

  closeInfo() {
    this.comentariosControlService.infoOpened = false;
  }
}
