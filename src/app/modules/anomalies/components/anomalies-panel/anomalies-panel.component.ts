import { Component, OnInit, Input } from '@angular/core';

import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

import { switchMap, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { AnomaliaService } from '@data/services/anomalia.service';
import { ReportControlService } from '@data/services/report-control.service';
import { PlantaService } from '@data/services/planta.service';

import { Anomalia } from '@core/models/anomalia';
import { PlantaInterface } from '@core/models/planta';

@Component({
  selector: 'app-anomalies-panel',
  templateUrl: './anomalies-panel.component.html',
  styleUrls: ['./anomalies-panel.component.css'],
})
export class AnomaliesPanelComponent implements OnInit {

  @Input() dataSource: MatTableDataSource<any>;

  public plantaId: string;
  private planta: PlantaInterface;
  public informesIdList: string[];
  public allAnomalias: Anomalia[];
  selectedInformeId: string;

  private subscriptions: Subscription = new Subscription();
  constructor(
    private reportControlService: ReportControlService,
    private plantaService: PlantaService,
    private anomaliaService: AnomaliaService,
  ) { }

  ngOnInit(): void {
    this.plantaId = this.reportControlService.plantaId;
    this.informesIdList = this.reportControlService.informesIdList;
    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId))
    );

    this.subscriptions.add(
      this.plantaService
        .getPlanta(this.plantaId)
        .pipe(
          take(1),
          switchMap((planta) => {
            this.planta = planta;

            return this.anomaliaService.getAnomaliasPlanta$(this.planta, this.reportControlService.informes);
          })
        )
        .subscribe((anomalias) => {
          // filtramos las anomalias que ya no consideramos anomalias
          console.log(this.anomaliaService.getRealAnomalias(anomalias).slice(0,10))
          this.allAnomalias = this.anomaliaService.getRealAnomalias(anomalias).slice(0,20);
        })
    );
    console.log(this.allAnomalias);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

}
