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
import { FilterService } from './filter.service';
import { PcService } from './pc.service';
import { PlantaService } from './planta.service';
import { ShareReportService } from './share-report.service';
import { StatsService } from './stats.service';
import { StructuresService } from './structures.service';
import { ZonesControlService } from './zones-control.service';
import { PortfolioControlService } from './portfolio-control.service';
import { ImageProcessService } from './image-process.service';
import { ImagesLoadService } from './images-load.service';
import { ImagesTilesService } from './images-tiles.service';

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
