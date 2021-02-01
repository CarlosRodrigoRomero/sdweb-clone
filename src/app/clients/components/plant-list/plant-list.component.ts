import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';

import { Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { AuthService } from '@core/services/auth.service';
import { PlantaService } from '@core/services/planta.service';
import { InformeService } from '@core/services/informe.service';

import { UserInterface } from '@core/models/user';
import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';

interface PlantsData {
  nombre: string;
  potencia: number;
  mae: number;
  ultimaInspeccion: number;
}

@Component({
  selector: 'app-plant-list',
  templateUrl: './plant-list.component.html',
  styleUrls: ['./plant-list.component.css'],
})
export class PlantListComponent implements OnInit, AfterViewInit {
  public user: UserInterface;
  plantasList$: Observable<PlantaInterface[]>;

  displayedColumns: string[] = ['nombre', 'potencia', 'mae', 'ultima-inspeccion', 'compartir'];
  dataSource: MatTableDataSource<PlantsData>;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(public auth: AuthService, private plantaService: PlantaService, private informeService: InformeService) {}

  ngOnInit(): void {
    const plantsData = [];
    this.auth.user$.subscribe((user) =>
      this.plantaService.getPlantasDeEmpresa(user).subscribe((plantas) => {
        plantas.forEach((planta) => {
          if (planta.informes !== undefined && planta.informes.length > 0) {
            plantsData.push({
              nombre: planta.nombre,
              potencia: planta.potencia,
              mae: planta.informes.reduce((prev, current) => (prev.fecha > current.fecha ? prev : current)).mae,
              ultimaInspeccion: planta.informes.reduce((prev, current) => (prev.fecha > current.fecha ? prev : current))
                .fecha,
            });
          }
        });
        console.log(plantsData);
      })
    );

    this.dataSource = new MatTableDataSource(plantsData);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  stopPropagation(event) {
    event.stopPropagation();
  }
}
