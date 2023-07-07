import { Component, OnInit } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';

import { MatCheckboxChange } from '@angular/material/checkbox';

import { Subscription } from 'rxjs';
import { take, switchMap } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core';

import { FilterService } from '@data/services/filter.service';
import { PcService } from '@data/services/pc.service';
import { ZonesService } from '@data/services/zones.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { FilterControlService } from '@data/services/filter-control.service';
import { PlantaService } from '@data/services/planta.service';
import { ReportControlService } from '@data/services/report-control.service';

import { ZonaFilter } from '@core/models/zonaFilter';
import { PlantaInterface } from '@core/models/planta';
import { LocationAreaInterface } from '@core/models/location';

export interface ZonaPc {
  label?: string;
  completed?: boolean;
  zona?: string;
  idZona?: number;
}

@Component({
  selector: 'app-zona-filter',
  templateUrl: './zona-filter.component.html',
  styleUrls: ['./zona-filter.component.css'],
})
export class ZonaFilterComponent implements OnInit {
  zonasPcs: ZonaPc[] = [];
  allComplete: boolean;
  filtroZona: ZonaFilter;
  public plantaId: string;
  private planta: PlantaInterface;
  zones: LocationAreaInterface[] = [];
  serviceInit = false;

  defaultLabelStatus = true;
  defaultSelectLabel = 'Zona';
  selectedLabels: string[] = [this.defaultSelectLabel];

  zonasSelected: boolean[];
  selection = new SelectionModel<ZonaPc>(true, []);

  selectedInformeId: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private filterService: FilterService,
    private pcService: PcService,
    private zonesService: ZonesService,
    private anomaliaService: AnomaliaService,
    private filterControlService: FilterControlService,
    private reportControlService: ReportControlService,
    private plantaService: PlantaService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.plantaId = this.reportControlService.plantaId;
    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId))
    );

    // Nos suscribimos al servicio de planta para obtener la planta
    this.subscriptions.add(
      this.plantaService
        .getPlanta(this.plantaId)
        .pipe(take(1))
        .subscribe((planta) => {
          this.planta = planta;
          this.planta = planta;
          // Una vez obtenida la planta, usamos el servicio de zonas para obtener las zonas de la planta
          this.zonesService.initService(planta).then((init) => (this.serviceInit = init));
          this.zones = this.zonesService.zonesBySize[0];
          this.zones = this.zones.sort((a, b) => parseInt(a.globalCoords[0]) - parseInt(b.globalCoords[0]));

          this.zones.forEach((zone, i) => {
            this.zonasPcs.push({ label: this.zoneTaskName(zone), zona: zone.globalCoords[0], idZona: i });
            this.zonasSelected.push(false);
          });
        })
    );

    // nos suscribimos a las zonas seleccionadas de filter control
    this.subscriptions.add(
      this.filterControlService.zonasSelected$.subscribe((zonasSel) => (this.zonasSelected = zonasSel))
    );

    // nos suscribimos a los labels del filter control
    this.subscriptions.add(
      this.filterControlService.selectedZonaLabels$.subscribe((labels) => (this.selectedLabels = labels))
    );

    // nos suscribimos al estado en el control de filtros
    this.subscriptions.add(
      this.filterControlService.labelZonaDefaultStatus$.subscribe((value) => (this.defaultLabelStatus = value))
    );

    this.subscriptions.add(
      this.translate.stream('Zona').subscribe((res: string) => {
        this.defaultSelectLabel = res;
      })
    );
  }

  onChangeFiltroZona(event: MatCheckboxChange) {
    if (event.checked) {
      this.filtroZona = new ZonaFilter(
        event.source.id,
        'zona',
        event.source.id,
        this.zonasPcs.length,
        Number(event.source.value)
      );
      
      this.filterService.addFilter(this.filtroZona);
      this.filterControlService.zonasSelected[event.source.value] = true;
      // añadimos el modelo seleccionado a la variable
      if (this.selectedLabels[0] !== this.defaultSelectLabel) {
        this.filterControlService.selectedZonaLabels.push(event.source.id);
      } else {
        this.filterControlService.labelZonaDefaultStatus = false;
        this.filterControlService.selectedZonaLabels = [event.source.id];
      }
    } else {
      this.filterService.filters$.pipe(take(1)).subscribe((filters) =>
        filters
          .filter((filter) => filter.type === 'zona')
          .forEach((filter) => {
            if (filter.id === event.source.id) {
              this.filterService.deleteFilter(filter);
            }
          })
      );

      this.filterControlService.zonasSelected[event.source.value] = false;

      // eliminamos el 'tipo' de seleccionados
      this.selectedLabels = this.selectedLabels.filter((sel) => sel !== event.source.id);
      // si era el último ponemos el label por defecto
      if (this.selectedLabels.length === 0) {
        this.filterControlService.labelZonaDefaultStatus = true;
        this.selectedLabels.push(this.defaultSelectLabel);
      }
    }
  }

  private zoneTaskName(zone: LocationAreaInterface): string {
    const planta = this.planta;

    let nombreGlobalCoord = '';
    let nombreGlobalCoordPlanta = '';
    if (planta.hasOwnProperty('nombreGlobalCoords')) {
      this.subscriptions.add(
        this.translate.stream(planta.nombreGlobalCoords[0]).subscribe((res: string) => {
          nombreGlobalCoordPlanta = res;
        })
      );
      nombreGlobalCoord = nombreGlobalCoordPlanta + ' ';
    }

    return nombreGlobalCoord + zone.globalCoords[0];
  }

  stopPropagation(event) {
    event.stopPropagation();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
