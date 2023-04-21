import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { ReportControlService } from '@data/services/report-control.service';
import { ResetServices } from '@data/services/reset-services.service';

@Component({
  selector: 'app-reports-content',
  templateUrl: './reports-content.component.html',
  styleUrls: ['./reports-content.component.css'],
})
export class ReportsContentComponent implements OnInit, OnDestroy {
  anomaliasLoaded = false;

  private subscriptions: Subscription = new Subscription();

  constructor(private reportControlService: ReportControlService, private resetServicesService: ResetServices) {}

  ngOnInit(): void {
    this.reportControlService.initService().then((res) => {
      this.anomaliasLoaded = res;
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();

    // reseteamos los servicios a sus valores por defecto
    this.resetServicesService.resetAllServices();
  }
}
