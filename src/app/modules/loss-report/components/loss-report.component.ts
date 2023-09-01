import { Component, OnInit } from '@angular/core';

import { ZonesService } from '@data/services/zones.service';
import { ReportControlService } from '@data/services/report-control.service';

@Component({
  selector: 'app-loss-report',
  templateUrl: './loss-report.component.html',
  styleUrls: ['./loss-report.component.css'],
})
export class LossReportComponent implements OnInit {
  thereAreModules = false;
  thereAreZones = false;
  showTest = false;

  constructor(private zonesService: ZonesService, private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    this.thereAreModules = this.zonesService.thereAreModules;
    this.thereAreZones = this.zonesService.thereAreZones;

    if (this.reportControlService.planta.id === '46RlWp2aZI2EkTdbNRtf') {
      this.thereAreModules = false;
      this.thereAreZones = false;
      this.showTest = true;
    }
  }
}
