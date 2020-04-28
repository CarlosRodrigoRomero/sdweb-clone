import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PlantaInterface } from 'src/app/models/planta';
import { PlantaService } from '../../services/planta.service';
import { switchMap, map } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { InformeService } from 'src/app/services/informe.service';

@Component({
  selector: 'app-informe-list-table',
  templateUrl: './informe-list-table.component.html',
  styleUrls: ['./informe-list-table.component.css'],
})
export class InformeListTableComponent implements OnInit {
  displayedColumns: string[] = ['nombre', 'potencia', 'tipo', 'fecha'];
  dataSource = new MatTableDataSource<PlantaInterface>();
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @Input() plantasConInformes: PlantaInterface[];

  constructor(public auth: AuthService, private informeService: InformeService, private plantaService: PlantaService) {}

  ngOnInit(): void {
    const plantas$ = this.auth.user$.pipe(
      switchMap((user) => {
        return this.plantaService.getPlantasDeEmpresa(user);
      })
    );

    const allInformes$ = this.informeService.getInformes();

    const plantasConInformes$ = allInformes$.pipe(
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
