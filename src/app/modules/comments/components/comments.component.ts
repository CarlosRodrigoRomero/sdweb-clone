import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { MatSidenav } from '@angular/material/sidenav';

import { Subscription } from 'rxjs';

import { ReportControlService } from '@data/services/report-control.service';
import { ComentariosControlService } from '@data/services/comentarios-control.service';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.css'],
})
export class CommentsComponent implements OnInit, OnDestroy {
  @ViewChild('sidenavLista') sidenavLeft: MatSidenav;
  anomaliasLoaded = false;
  sidenavOpened = true;
  vistaSelected: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private comentariosControlService: ComentariosControlService
  ) {}

  ngOnInit(): void {
    this.reportControlService.initService().then((res) => {
      this.anomaliasLoaded = res;

      this.comentariosControlService.dataLoaded = res;
    });

    this.comentariosControlService.sidenavOpened$.subscribe((opened) => (this.sidenavOpened = opened));

    this.comentariosControlService.vistaSelected$.subscribe((vista) => (this.vistaSelected = vista));
  }

  ngOnDestroy(): void {
    this.comentariosControlService.dataLoaded = false;

    this.subscriptions.unsubscribe();
  }
}
