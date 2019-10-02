import { Component, OnInit } from "@angular/core";
import { InformeInterface } from "../../models/informe";
import { AuthService } from "src/app/services/auth.service";
import { PlantaService } from "../../services/planta.service";
import { PlantaInterface } from "../../models/planta";
import { InformeService } from "src/app/services/informe.service";
import { Observable } from "rxjs";
import { UserInterface } from "src/app/models/user";

@Component({
  selector: "app-informes",
  templateUrl: "./informes.component.html",
  styleUrls: ["./informes.component.css"]
})
export class InformesComponent implements OnInit {
  public informes: InformeInterface[];
  public plantas: PlantaInterface[];
  public user$: Observable<UserInterface>;

  constructor(
    public auth: AuthService,
    private plantaService: PlantaService,
    private informeService: InformeService
  ) {}

  ngOnInit() {
    this.auth.user$.subscribe(user => {
      this.plantaService.getPlantasDeEmpresa(user).subscribe(plantas => {
        this.getInformesDePlantas(plantas);
      });
    });
  }

  getInformesDePlantas(plantas: PlantaInterface[]) {
    let plantasConInformes = [];
    plantas.forEach(planta => {
      planta.informes = [] as InformeInterface[];
      this.informeService.getInformesDePlanta(planta.id).subscribe(informes => {
        planta.informes = informes;
        plantasConInformes.push(planta);
        this.plantas = plantasConInformes;
      });
    });
  }

  checkInformeDisponible(informe: InformeInterface) {
    return (
      ("disponible" in informe && informe.disponible === true) ||
      !("disponible" in informe)
    );
  }

  updateInforme(informe: InformeInterface) {
    this.informeService.updateInforme(informe);
  }
}
