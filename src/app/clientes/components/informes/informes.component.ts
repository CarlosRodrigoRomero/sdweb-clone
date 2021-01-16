import { Component, OnInit } from '@angular/core';
import { InformeInterface } from '@core/models/informe';
import { AuthService } from '@core/services/auth.service';
import { PlantaService } from '@core/services/planta.service';
import { PlantaInterface } from '@core/models/planta';
import { InformeService } from '@core/services/informe.service';
import { Observable } from 'rxjs';
import { UserInterface } from '@core/models/user';
import { take, switchMap, map } from 'rxjs/operators';

@Component({
  selector: 'app-informes',
  templateUrl: './informes.component.html',
  styleUrls: ['./informes.component.css'],
})
export class InformesComponent implements OnInit {
  public informes: InformeInterface[];
  public plantasConInformes: PlantaInterface[];
  public allPlantas: PlantaInterface[];
  public user: UserInterface;
  plantasList$: Observable<PlantaInterface[]>;

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
  }

  checkInformeDisponible(informe: InformeInterface) {
    return ('disponible' in informe && informe.disponible === true) || !('disponible' in informe);
  }

  updateInforme(informe: InformeInterface): void {
    informe.disponible = !informe.disponible;
    this.informeService.updateInforme(informe);
  }

  updateAutoLocReady(planta: PlantaInterface): void {
    planta.autoLocReady = !planta.autoLocReady;
    this.plantaService.updatePlanta(planta);
  }
  checkAutoLocReady(planta: PlantaInterface) {
    if (!planta.hasOwnProperty('autoLocReady')) {
      return false;
    } else {
      return planta.autoLocReady;
    }
  }
}
