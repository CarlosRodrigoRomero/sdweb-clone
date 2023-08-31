import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { ReportControlService } from '@data/services/report-control.service';

interface ReportData {
  id: string;
  date: number;
}

@Component({
  selector: 'app-report-selector',
  templateUrl: './report-selector.component.html',
  styleUrls: ['./report-selector.component.css'],
})
export class ReportSelectorComponent implements OnInit, OnDestroy {
  reportSelected: ReportData;
  reports: ReportData[] = [];

  private subscriptions: Subscription = new Subscription();

  constructor(private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    this.reportControlService.informes
      .slice()
      .reverse()
      .forEach((informe) => {
        this.reports.push({
          id: informe.id,
          date: informe.fecha,
        });
      });

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => {
        this.reportSelected = this.reports.find((report) => report.id === informeId);
      })
    );
  }

  onReportChange(data: any): void {
    this.reportControlService.selectedInformeId = data.value.id;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
