import { Component, OnInit } from "@angular/core";
import { PlantaService } from "src/app/services/planta.service";

@Component({
  selector: "app-planta-list",
  templateUrl: "./planta-list.component.html",
  styleUrls: ["./planta-list.component.css"]
})
export class PlantaListComponent implements OnInit {
  constructor(private plantaService: PlantaService) {}

  ngOnInit() {}
}
