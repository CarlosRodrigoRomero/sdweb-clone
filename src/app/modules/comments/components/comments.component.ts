import { Component, OnInit, ViewChild } from '@angular/core';

import { MatSidenav } from '@angular/material/sidenav';

import { ReportControlService } from '@data/services/report-control.service';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.css'],
})
export class CommentsComponent implements OnInit {
  @ViewChild('sidenavLista') sidenavLeft: MatSidenav;

  anomaliasLoaded = false;

  constructor(private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    this.reportControlService.initService().then((res) => {
      this.anomaliasLoaded = res;
    });
  }
}
