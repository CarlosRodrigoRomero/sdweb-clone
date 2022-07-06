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
import { FilterService } from '@data/services/filter.service';
import { FilterControlService } from '@data/services/filter-control.service';
import { PcService } from '@data/services/pc.service';
import { PlantaService } from '@data/services/planta.service';
import { ShareReportService } from '@data/services/share-report.service';
import { StatsService } from '@data/services/stats.service';
import { StructuresService } from '@data/services/structures.service';
import { ZonesControlService } from '@data/services/zones-control.service';
import { PortfolioControlService } from '@data/services/portfolio-control.service';
import { ImageProcessService } from '@data/services/image-process.service';
import { ImagesLoadService } from '@data/services/images-load.service';
import { ImagesTilesService } from '@data/services/images-tiles.service';

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
    private clustersService: ClustersService,
    private filterService: FilterService,
    private filterControlService: FilterControlService,
    private pcService: PcService,
    private plantaService: PlantaService,
    private shareReportService: ShareReportService,
    private statsService: StatsService,
    private structuresService: StructuresService,
    private zonesControlService: ZonesControlService,
    private portfolioControlService: PortfolioControlService,
    private imageProcessService: ImageProcessService,
    private imagesLoadService: ImagesLoadService,
    private imagesTilesService: ImagesTilesService
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
    this.filterService.resetService();
    this.filterControlService.resetService();
    this.pcService.resetService();
    this.plantaService.resetService();
    this.shareReportService.resetService();
    this.statsService.resetService();
    this.structuresService.resetService();
    this.zonesControlService.resetService();
    this.portfolioControlService.resetService();
    this.imageProcessService.resetService();
    this.imagesLoadService.resetService();
    this.imagesTilesService.resetService();
  }
}
