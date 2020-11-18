import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PlantaInterface } from '@core/models/planta';
import { PlantaService } from '@core/services/planta.service';
import { switchMap, map, take } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';
import { InformeService } from '@core/services/informe.service';
import { UserInterface } from '@core/models/user';

@Component({
  selector: 'app-informe-list-table',
  templateUrl: './informe-list-table.component.html',
  styleUrls: ['./informe-list-table.component.css'],
})
export class InformeListTableComponent implements OnInit {
  displayedColumns: string[] = ['nombre', 'potencia', 'tipo', 'fecha'];
  displayedColumnsLocs: string[] = ['nombre', 'potencia', 'tipo', 'localizaciones'];
  dataSource = new MatTableDataSource<PlantaInterface>();
  dataSourceLocs = new MatTableDataSource<PlantaInterface>();
  public user: UserInterface;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(public auth: AuthService, private informeService: InformeService, private plantaService: PlantaService) {}

  ngOnInit(): void {
    const plantas$ = this.auth.user$.pipe(
      take(1),
      switchMap((user) => {
        this.user = user;
        return this.plantaService.getPlantasDeEmpresa(user);
      })
    );
    plantas$
      .pipe(
        map((result) => {
          return result.filter((planta) => {
            if (!planta.hasOwnProperty('autoLocReady')) {
              return false;
            } else {
              return !planta.autoLocReady;
            }
          });
        })
      )
      .subscribe((plantasArray) => {
        this.dataSourceLocs.data = plantasArray;
      });

    const allInformes$ = this.informeService.getInformes();

    const plantasConInformes$ = allInformes$.pipe(
      take(1),
      switchMap((informesArray) => {
        return plantas$.pipe(
          map((plantasArray) => {
            plantasArray.map((planta) => {
              planta.informes = informesArray.filter((informe) => {
                return informe.plantaId === planta.id && !informe.disponible;
              });
              return planta;
            });
            return plantasArray.filter((planta) => {
              return planta.informes.length > 0;
            });
          })
        );
      })
    );
    plantasConInformes$.subscribe((plantas) => {
      this.dataSource.data = plantas;
    });
  }

  // getInformesDePlantas(plantas: PlantaInterface[]) {
  //   const plantasConInformes = [] as PlantaInterface[];
  //   plantas.forEach((planta) => {
  //     planta.informes = [] as InformeInterface[];
  //     this.informeService
  //       .getInformesDePlanta(planta.id)
  //       .pipe(take(1))
  //       .subscribe((informes) => {
  //         planta.informes = informes;
  //         plantasConInformes.push(planta);
  //         this.plantas = plantasConInformes;
  //       });
  //   });
  // }

  //   this.dataSource.sort = this.sort;
  //   console.log('InformeListTableComponent -> plantasConInformes', plantasConInformes);
  // }
}
