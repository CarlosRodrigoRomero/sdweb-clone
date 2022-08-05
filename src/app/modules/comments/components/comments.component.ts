import { Component, OnInit } from '@angular/core';

import { ReportControlService } from '@data/services/report-control.service';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.css'],
})
export class CommentsComponent implements OnInit {
  anomaliasLoaded = false;

  constructor(private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    this.reportControlService.initService().then((res) => {
      this.anomaliasLoaded = res;
    });
  }
}
