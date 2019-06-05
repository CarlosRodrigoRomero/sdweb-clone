import { Component, OnInit } from "@angular/core";
import { InformeInterface } from "../../models/informe";
import { AuthService } from "src/app/services/auth.service";
import { PlantaService } from "../../services/planta.service";
import { PlantaInterface } from "../../models/planta";
import { InformeService } from "src/app/services/informe.service";

@Component({
  selector: "app-informes",
  templateUrl: "./informes.component.html",
  styleUrls: ["./informes.component.css"]
})
export class InformesComponent implements OnInit {
  public informes: InformeInterface[];
  public plantas: PlantaInterface[];

  constructor(
    private auth: AuthService,
    private plantaService: PlantaService,
    private informeService: InformeService
  ) {}

  ngOnInit() {
    this.auth.user$.subscribe(user => {
      this.plantaService.getPlantasDeEmpresa(user.uid).subscribe(plantas => {
        this.getInformesDePlantas(plantas);
      });
    });
  }

  getInformesDePlantas(plantas: PlantaInterface[]) {
    let plantasConInformes = [];
    plantas.forEach(planta => {
      planta.informes = [] as InformeInterface[];
      this.plantaService
        .getPlantasDeEmpresa(planta.empresa)
        .subscribe(plantas => {
          console.log(
            "TCL: InformesComponent -> getInformesDePlantas -> plantas",
            plantas
          );
          plantas.forEach(planta => {
            this.informeService
              .getInformesDePlanta(planta.id)
              .subscribe(informes => {
                console.log(
                  "TCL: InformesComponent -> getInformesDePlantas -> informes",
                  informes
                );
                planta.informes = informes;
                plantasConInformes.push(planta);
                this.plantas = plantasConInformes;
              });
          });
        });
    });
  }
}
