import { Component, OnInit } from '@angular/core';

import { LatLng } from '@agm/core';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';

import { PlantaService } from '@core/services/planta.service';
import { InformeService } from '@core/services/informe.service';
import { FilterService } from '@core/services/filter.service';
import { PcService } from '@core/services/pc.service';

import { PcInterface } from '@core/models/pc';
import { SeguidorInterface } from '@core/models/seguidor';

// declare const google: any;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit {
  public map: any;
  public seguidores: Array<SeguidorInterface> = [];
  public seguidoresPrueba = [];
  public planta: PlantaInterface;
  public informe: InformeInterface;

  constructor(
    private plantaService: PlantaService,
    private informeService: InformeService,
    public filterService: FilterService,
    public pcService: PcService
  ) {
    this.filterService.filteredPcs = this.pcService.allPcs;
    this.filterService.filteredPcs$.next(this.filterService.filteredPcs);
    this.getSeguidores();
  }

  ngOnInit(): void {
    this.planta = this.plantaService.get();
    this.informe = this.informeService.get();
  }

  onMapReady(map) {
    this.map = map;
    this.plantaService.initMap(this.planta, map);
  }

  getSeguidores() {
    const lngs = this.filterService.filteredPcs
      .map((pc) => pc.gps_lng)
      .filter((value, index, self) => self.indexOf(value) === index);

    lngs.forEach((lng) => {
      const seguidor: SeguidorInterface = {};
      seguidor.lng = lng;
      seguidor.lat = this.filterService.filteredPcs.find((pc) => pc.gps_lng === lng).gps_lat;
      seguidor.pcs = this.filterService.filteredPcs.filter((pc) => pc.gps_lng === lng).map((pc) => pc.id);
      this.seguidores.push(seguidor);
    });
  }

  getPcsSeguidor(lng: number) {
    return this.seguidores.find((seg) => seg.lng === lng).pcs;
  }

  getMaeSeguidor(lng: number) {
    const potenciaSeguidor = this.planta.filas * this.planta.columnas * this.planta.moduloPotencia;
    let totalPerdidas = 0;
    console.log(this.getPcsSeguidor(lng));
    this.getPcsSeguidor(lng).forEach(
      (idPc) =>
        (totalPerdidas +=
          this.filterService.filteredPcs.find((pc) => pc.id === idPc).perdidas * this.planta.moduloPotencia)
    );
    const mae = totalPerdidas / potenciaSeguidor;
    console.log(mae);
  }
}
