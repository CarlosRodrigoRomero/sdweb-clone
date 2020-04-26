import { Component, OnInit } from '@angular/core';
import { InformeInterface } from '../../models/informe';
import { AuthService } from 'src/app/services/auth.service';
import { PlantaService } from '../../services/planta.service';
import { PlantaInterface } from '../../models/planta';
import { InformeService } from 'src/app/services/informe.service';
import { Observable } from 'rxjs';
import { UserInterface } from 'src/app/models/user';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-informes',
  templateUrl: './informes.component.html',
  styleUrls: ['./informes.component.css'],
})
export class InformesComponent implements OnInit {
  public informes: InformeInterface[];
  public plantas: PlantaInterface[];
  public user$: Observable<UserInterface>;
  public user: UserInterface;

  constructor(public auth: AuthService, private plantaService: PlantaService, private informeService: InformeService) {}

  ngOnInit() {
    this.auth.user$.subscribe((user) => {
      this.user = user;
      this.plantaService
        .getPlantasDeEmpresa(user)
        .pipe(take(1))
        .subscribe((plantas) => {
          this.getInformesDePlantas(plantas);
        });
    });
  }

  getInformesDePlantas(plantas: PlantaInterface[]) {
    const plantasConInformes = [];
    plantas.forEach((planta) => {
      planta.informes = [] as InformeInterface[];
      this.informeService
        .getInformesDePlanta(planta.id)
        .pipe(take(1))
        .subscribe((informes) => {
          planta.informes = informes;
          plantasConInformes.push(planta);
          this.plantas = plantasConInformes;
        });
    });
  }

  checkInformeDisponible(informe: InformeInterface) {
    return ('disponible' in informe && informe.disponible === true) || !('disponible' in informe);
  }

  updateInforme(informe: InformeInterface) {
    informe.disponible = !informe.disponible;
    this.informeService.updateInforme(informe);
  }
}
