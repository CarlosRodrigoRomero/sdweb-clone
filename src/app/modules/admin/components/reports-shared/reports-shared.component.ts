import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';

import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { ShareReportService } from '@data/services/share-report.service';
import { PlantaService } from '@data/services/planta.service';

import { PlantaInterface } from '@core/models/planta';

@Component({
  selector: 'app-reports-shared',
  templateUrl: './reports-shared.component.html',
  styleUrls: ['./reports-shared.component.css'],
})
export class ReportsSharedComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort) sort: MatSort;
  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = ['planta', 'fechaCreacion', 'ultimoAcceso', 'numAccesos'];
  private plantas: PlantaInterface[] = [];

  private subscriptions: Subscription = new Subscription();

  constructor(private shareReportService: ShareReportService, private plantaService: PlantaService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.plantaService
        .getAllPlantas()
        .pipe(
          switchMap((plantas) => {
            this.plantas = plantas;

            return this.shareReportService.getSharedReports();
          })
        )
        .subscribe((reports) => {
          const reportsShared = reports.filter((report) => report.hasOwnProperty('fechaCreacion'));
          const dataShared = [];

          reportsShared.forEach((report) => {
            dataShared.push({
              planta: this.plantas.find((planta) => planta.id === report.plantaId).nombre,
              fechaCreacion: report.fechaCreacion,
              ultimoAcceso: report.ultimoAcceso,
              numAccesos: report.numAccesos,
            });
          });

          this.dataSource.data = dataShared;
        })
    );
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
