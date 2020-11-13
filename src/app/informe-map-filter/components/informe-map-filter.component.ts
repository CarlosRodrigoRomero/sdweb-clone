import { Component, OnInit, ViewChild } from '@angular/core';
import { AgmMap } from '@agm/core';

import { PlantaInterface } from '../../models/planta';
import { InformeInterface } from '../../models/informe';
import { UserAreaInterface } from '../../models/userArea';
import { PlantaService } from '../../services/planta.service';
import { InformeService } from '../../services/informe.service';

declare const google: any;

@Component({
  selector: 'app-informe-map-filter',
  templateUrl: './informe-map-filter.component.html',
  styleUrls: ['./informe-map-filter.component.css'],
})
export class InformeMapFilterComponent implements OnInit {
  @ViewChild('agm-map') map: AgmMap;

  public planta: PlantaInterface;
  public informe: InformeInterface;
  public circleRadius: number;
  public userAreaList: UserAreaInterface[];
  public mapType = 'satellite';
  public mapLoaded = false;

  constructor(private plantaService: PlantaService, private informeService: InformeService) {}

  ngOnInit(): void {
    this.planta = this.plantaService.get();
    this.informe = this.informeService.get();
    this.circleRadius = 5;
    if (this.planta.tipo === 'fija') {
      this.circleRadius = 2;
    } else if (this.planta.tipo === '1 eje') {
      this.circleRadius = 2;
    }

    this.plantaService.getUserAreas$(this.planta.id).subscribe((userAreas) => {
      this.userAreaList = userAreas;
    });
  }

  mapIsReady(map) {
    this.mapLoaded = true;
    this.plantaService.initMap(this.planta, map);
  }
}
