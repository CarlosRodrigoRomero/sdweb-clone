import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';

import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { InformeService } from '@core/services/informe.service';

import { PlantaService } from '@core/services/planta.service';
import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent implements OnInit, AfterViewInit {
  private plantas: PlantaInterface[];
  private informes: InformeInterface[];
  displayedColumns: string[] = ['planta', 'fecha', 'informeId', 'potencia', 'actions'];
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatSort) sort: MatSort;

  constructor(private informeService: InformeService, private plantaService: PlantaService) {}

  ngOnInit(): void {
    this.plantaService
      .getAllPlantas()
      .pipe(
        switchMap((plantas) => {
          this.plantas = plantas;
          return this.informeService.getInformes();
        })
      )
      .subscribe((informes) => {
        const dataInformes: any[] = [];
        informes.forEach((informe) => {
          const planta: PlantaInterface = this.plantas.find((pl) => pl.id === informe.plantaId);
          dataInformes.push({
            planta: planta.nombre,
            fecha: informe.fecha,
            informeId: informe.id,
            potencia: planta.potencia,
          });
        });
        this.dataSource.data = dataInformes;
      });
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
}
