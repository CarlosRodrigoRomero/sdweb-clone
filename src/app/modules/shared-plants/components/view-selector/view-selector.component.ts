import { Component, OnInit } from '@angular/core';
import { ReportControlService } from '@data/services/report-control.service';
import { ViewReportService } from '@data/services/view-report.service';
import { Subscription } from 'rxjs';

interface View {
  view: string;
  label: string;
}

@Component({
  selector: 'app-view-selector',
  templateUrl: './view-selector.component.html',
  styleUrls: ['./view-selector.component.css'],
})
export class ViewSelectorComponent implements OnInit {
  views: View[] = [
    {
      view: 'mae',
      label: 'Por MAE',
    },
    {
      view: 'cc',
      label: 'Por célula calientes (Tª max)',
    },
    {
      view: 'grad',
      label: 'Por gradiente de Tª max normalizado',
    },
  ];

  viewSelected: string;

  private subscriptions: Subscription = new Subscription();

  constructor(private viewReportService: ViewReportService, private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    if (this.reportControlService.plantaNoS2E) {
      this.views = [{ view: 'tipo', label: 'Por tipo de anomalía' }, ...this.views];
    }

    this.subscriptions.add(this.viewReportService.reportViewSelected$.subscribe((view) => (this.viewSelected = view)));
  }

  onSelectionChange() {
    this.viewReportService.reportViewSelected = this.viewSelected;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
