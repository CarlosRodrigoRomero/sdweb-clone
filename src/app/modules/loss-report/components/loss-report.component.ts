import { Component, OnInit } from '@angular/core';

import { ZonesService } from '@data/services/zones.service';

@Component({
  selector: 'app-loss-report',
  templateUrl: './loss-report.component.html',
  styleUrls: ['./loss-report.component.css'],
})
export class LossReportComponent implements OnInit {
  thereAreModules = false;

  constructor(private zonesService: ZonesService) {}

  ngOnInit(): void {
    this.thereAreModules = this.zonesService.thereAreModules;
  }
}
