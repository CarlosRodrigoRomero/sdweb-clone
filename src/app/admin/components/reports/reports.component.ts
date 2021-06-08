import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { switchMap } from 'rxjs/operators';
import { combineLatest, Subscription } from 'rxjs';

import { InformeService } from '@core/services/informe.service';
import { ThermalService } from '@core/services/thermal.service';
import { PlantaService } from '@core/services/planta.service';

import { PlantaInterface } from '@core/models/planta';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {
  private plantas: PlantaInterface[];
  displayedColumns: string[] = ['planta', 'fecha', 'informeId', 'potencia', 'actions'];
  dataSource = new MatTableDataSource<any>();
  private subscriptions: Subscription = new Subscription();

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private informeService: InformeService,
    private plantaService: PlantaService,
    private thermalService: ThermalService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.plantaService
        .getAllPlantas()
        .pipe(
          switchMap((plantas) => {
            this.plantas = plantas;

            return combineLatest([this.informeService.getInformes(), this.thermalService.getThermalLayers()]);
          })
        )
        .subscribe(([informes, thermalLayers]) => {
          const dataInformes: any[] = [];
          informes.forEach((informe) => {
            const planta: PlantaInterface = this.plantas.find((pl) => pl.id === informe.plantaId);

            // comprobamos si existe la capa termica del informe
            let thermalLayerPending = true;
            if (thermalLayers.map((tL) => tL.informeId).includes(informe.id)) {
              thermalLayerPending = false;
            }

            dataInformes.push({
              planta: planta.nombre,
              fecha: informe.fecha,
              informeId: informe.id,
              potencia: planta.potencia,
              thermalLayerPending,
            });
          });

          // ordenamos la planta de inicio por el nombre de la planta
          this.dataSource.data = dataInformes.sort((a, b) => {
            if (a.planta < b.planta) {
              return -1;
            }
            if (a.planta > b.planta) {
              return 1;
            }
            return 0;
          });
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

  private unixToDate(unix: number): string {
    const date = new Date(unix * 1000);

    return date.toLocaleString().split(' ')[0];
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
