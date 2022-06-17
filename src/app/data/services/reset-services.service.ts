import { Injectable } from '@angular/core';

import { ReportControlService } from '@data/services/report-control.service';
import { OlMapService } from '@data/services/ol-map.service';
import { ThermalService } from '@data/services/thermal.service';
import { DownloadReportService } from '@data/services/download-report.service';
import { ZonesService } from '@data/services/zones.service';
import { ViewReportService } from '@data/services/view-report.service';
import { AnomaliasControlService } from '@data/services/anomalias-control.service';
import { AnomaliaInfoService } from '@data/services/anomalia-info.service';
import { SeguidoresControlService } from '@data/services/seguidores-control.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { ClustersService } from '@data/services/clusters.service';

@Injectable({
  providedIn: 'root',
})
export class ResetServices {
  constructor(
    private reportControlService: ReportControlService,
    private olMapService: OlMapService,
    private thermalService: ThermalService,
    private downloadReportService: DownloadReportService,
    private zonesService: ZonesService,
    private viewReportService: ViewReportService,
    private anomaliasControlService: AnomaliasControlService,
    private anomaliaInfoService: AnomaliaInfoService,
    private seguidoresControlService: SeguidoresControlService,
    private anomaliaService: AnomaliaService,
    private clustersService: ClustersService
  ) {}

  resetServices() {
    this.reportControlService.resetService();
    this.olMapService.resetService();
    this.thermalService.resetService();
    this.downloadReportService.resetService();
    this.viewReportService.resetService();
    this.zonesService.resetService();
    this.anomaliasControlService.resetService();
    this.anomaliaInfoService.resetService();
    this.seguidoresControlService.resetService();
    this.anomaliaService.resetService();
    this.clustersService.resetService();
  }
}
