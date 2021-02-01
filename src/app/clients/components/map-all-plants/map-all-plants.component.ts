import { Component, OnInit } from '@angular/core';

import { Observable } from 'rxjs';

import { AuthService } from '@core/services/auth.service';
import { PlantaService } from '@core/services/planta.service';

import { PlantaInterface } from '@core/models/planta';

@Component({
  selector: 'app-map-all-plants',
  templateUrl: './map-all-plants.component.html',
  styleUrls: ['./map-all-plants.component.css'],
})
export class MapAllPlantsComponent implements OnInit {
  plantas: PlantaInterface[];

  constructor(private plantaService: PlantaService, public auth: AuthService) {}

  ngOnInit(): void {
    this.auth.user$.subscribe((user) =>
      this.plantaService.getPlantasDeEmpresa(user).subscribe((plantas) => (this.plantas = plantas))
    );
  }

  clickedMarker(label: string, index: number) {
    console.log(`clicked the marker: ${label || index}`);
  }
}
