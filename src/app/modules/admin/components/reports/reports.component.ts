import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatInput } from '@angular/material/input';

import { switchMap, take } from 'rxjs/operators';
import { combineLatest, Subscription } from 'rxjs';

import { InformeService } from '@data/services/informe.service';
import { ThermalService } from '@data/services/thermal.service';
import { PlantaService } from '@data/services/planta.service';

import { PlantaInterface } from '@core/models/planta';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {
  private plantas: PlantaInterface[];
  displayedColumns: string[] = [
    'warnings',
    'planta',
    'fecha',
    'tipo',
    'potencia',
    'informeId',
    'disponible',
    'actions',
  ];
  dataSource = new MatTableDataSource<any>();
  private subscriptions: Subscription = new Subscription();

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('search') search: ElementRef;

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
              tipo: planta.tipo,
              potencia: planta.potencia,
              informeId: informe.id,
              disponible: informe.disponible,
              thermalLayerPending,
              plantaId: planta.id,
            });
          });

          // ordenamos los informes mostrandos los mas recientes
          this.dataSource.data = dataInformes.sort((a, b) => b.fecha - a.fecha);
        })
    );
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.search.nativeElement.focus();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
