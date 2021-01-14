import { Component, OnInit } from '@angular/core';
import { PlantaInterface } from '@core/models/planta';
import { UserInterface } from '@core/models/user';
import { AuthService } from '@core/services/auth.service';
import { InformeService } from '@core/services/informe.service';
import { PlantaService } from '@core/services/planta.service';
import { Observable } from 'rxjs';
import { take, switchMap, map } from 'rxjs/operators';
import { InformeInterface } from '../../../core/models/informe';

@Component({
  selector: 'app-portfolio-benchmark',
  templateUrl: './portfolio-benchmark.component.html',
  styleUrls: ['./portfolio-benchmark.component.css'],
})
export class PortfolioBenchmarkComponent implements OnInit {
  public user: UserInterface;
  plantasList$: Observable<PlantaInterface[]>;
  public dataSource: any;
  public chartOptions: any;
  allInformes: InformeInterface[];

  constructor(public auth: AuthService, private plantaService: PlantaService, private informeService: InformeService) {}
  ngOnInit() {
    const plantas$ = this.auth.user$.pipe(
      take(1),
      switchMap((user) => {
        this.user = user;
        return this.plantaService.getPlantasDeEmpresa(user);
      })
    );

    const allInformes$ = this.informeService.getInformes();

    const allPlantasConInformes$ = allInformes$.pipe(
      switchMap((informesArray) => {
        this.allInformes = informesArray;
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

    this.plantasList$ = allPlantasConInformes$.pipe(
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
    this.plantasList$.subscribe((plantas) => {
      console.log(
        '🚀 ~ file: portfolio-benchmark.component.ts ~ line 64 ~ PortfolioBenchmarkComponent ~ this.plantasList$.subscribe ~ plantas',
        plantas
      );
      this.initChart(plantas);
    });
  }

  initChart(plantas: PlantaInterface[]) {
    // Crear dataset
    // const years = [{year: 2019, data: []}, {year: 2020, data: []}];

    // Ordenar plantas por orden alfabetico
    let datasets = [];
    const years = [2019, 2020];
    years.forEach((y) => {
      let data = [];
      plantas.forEach((p) => {
        const informesPlanta = this.allInformes.filter((inf) => {
          const fecha_informe = new Date(inf.fecha * 1000);
          return inf.plantaId == p.id && fecha_informe.getFullYear() == y;
        });
        if (informesPlanta.length > 0 && informesPlanta[0].mae !== undefined) {
          data.push(informesPlanta[0].mae);
        } else {
          data.push(0);
        }
      });
      console.log(y, data);
      datasets.push({
        label: y.toString(),
        backgroundColor: 'red',
        data,
      });
    });

    this.dataSource = {
      labels: plantas.map((planta) => {
        return planta.nombre;
      }),
      datasets,
    };
    this.chartOptions = {};
  }
}
