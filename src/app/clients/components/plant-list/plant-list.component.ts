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

  constructor(public auth: AuthService, private plantaService: PlantaService, private informeService: InformeService) {
    const plantas$ = this.auth.user$.pipe(
      take(1),
      switchMap((user) => {
        this.user = user;
        return this.plantaService.getPlantasDeEmpresa(user);
      })
    );

    const allInformes$ = this.informeService.getInformes();

    const allPlantas$ = allInformes$.pipe(
      switchMap((informesArray) => {
        return plantas$.pipe(
          map((plantasArray) => {
            return plantasArray.map((planta) => {
              planta.informes = informesArray.filter((informe) => {
                return informe.plantaId === planta.id;
              });
              return planta;
            });
          })
        );
      })
    );

    this.plantasList$ = allPlantas$.pipe(
      map((plantasArray) => {
        if (this.user.role === 1) {
          return plantasArray;
        } else {
          return plantasArray.filter((planta) => {
            planta.informes = planta.informes.filter((informe) => {
              return informe.disponible;
            });
            return planta.informes.length > 0;
          });
        }
      })
    );

    const data = [];
    this.plantasList$.subscribe((plantas) =>
      plantas.forEach((planta) => {
        // this.getFechaUltimoInforme(planta.id);
        data.push({
          nombre: planta.nombre,
          potencia: planta.potencia,
          mae: 1,
          ultimaInspeccion: 2,
        });
      })
    );

    console.log(data);

    this.dataSource = new MatTableDataSource(data);
  }

  ngOnInit(): void {}

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

  getFechaUltimoInforme(plantaId: string) {
    const fechas: number[] = [];
    this.informeService
      .getInformesDePlanta(plantaId)
      .subscribe((informes) => informes.forEach((informe) => fechas.push(informe.fecha)));
    if (fechas.length > 1) {
      console.log(Math.max(...fechas));
    } else {
      console.log(fechas[0]);
    }
  }
}
