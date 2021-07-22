import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { Subscription } from 'rxjs';

import { GLOBAL } from '@core/services/global';
import { SeguidoresControlService } from '../../services/seguidores-control.service';
import { SeguidorViewService } from '../../services/seguidor-view.service';

import { Seguidor } from '@core/models/seguidor';
import { Anomalia } from '@core/models/anomalia';

interface AnomaliaData {
  id: string;
  tipo: string;
  perdidas: number;
  tempMax: number;
  gradiente: number;
}

@Component({
  selector: 'app-seguidor-anomalias-list',
  templateUrl: './seguidor-anomalias-list.component.html',
  styleUrls: ['./seguidor-anomalias-list.component.css'],
})
export class SeguidorAnomaliasListComponent implements OnInit, AfterViewInit, OnDestroy {
  seguidorSelected: Seguidor = undefined;
  anomaliaHovered: Anomalia = undefined;
  anomaliaSelected: Anomalia = undefined;
  dataSource: MatTableDataSource<AnomaliaData>;
  displayedColumns = ['id', 'tipo', 'perdidas', 'tempMax', 'gradiente'];

  private subscriptions: Subscription = new Subscription();

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private seguidoresControlService: SeguidoresControlService,
    private seguidorViewService: SeguidorViewService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.seguidoresControlService.seguidorSelected$.subscribe((seguidor) => {
        this.seguidorSelected = seguidor;

        if (this.seguidorSelected.anomalias.length > 0) {
          const anomalias = [];
          this.seguidorSelected.anomalias.forEach((anom) => {
            let perdidas;
            if (anom.perdidas !== undefined) {
              perdidas = anom.perdidas + '%';
            }
            let tempMax;
            if (anom.temperaturaMax !== undefined) {
              tempMax = anom.temperaturaMax + 'ºC';
            }
            let gradiente;
            if (anom.gradienteNormalizado !== undefined) {
              gradiente = anom.gradienteNormalizado + 'ºC';
            }
            anomalias.push({
              id: anom.localId,
              tipo: GLOBAL.pcDescripcion[anom.tipo],
              perdidas,
              tempMax,
              gradiente,
              anomalia: anom,
            });
          });
          this.dataSource = new MatTableDataSource(anomalias);
          this.dataSource.sort = this.sort;
        }
      })
    );

    this.subscriptions.add(
      this.seguidorViewService.anomaliaHovered$.subscribe((anomHov) => (this.anomaliaHovered = anomHov))
    );
    this.subscriptions.add(
      this.seguidorViewService.anomaliaSelected$.subscribe((anomSel) => (this.anomaliaSelected = anomSel))
    );
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  hoverAnomalia(row: any) {
    if (this.anomaliaSelected !== row.anomalia) {
      this.seguidorViewService.anomaliaHovered = row.anomalia;
      // this.anomaliasControlService.setExternalStyle(row.id, true);
    }
  }

  unhoverAnomalia(row: any) {
    if (this.anomaliaSelected !== row.anomalia) {
      this.seguidorViewService.anomaliaHovered = undefined;
      // this.anomaliasControlService.setExternalStyle(row.id, false);
    }
  }

  selectAnomalia(row: any) {
    // quitamos el hover del seguidor
    this.seguidorViewService.anomaliaHovered = undefined;

    // reiniciamos el estilo al anterior seguidor
    /*  if (this.anomaliasControlService.prevAnomaliaSelect !== undefined) {
      this.anomaliasControlService.setExternalStyle(this.anomaliasControlService.prevAnomaliaSelect.id, false);
    }
    this.anomaliasControlService.prevAnomaliaSelect = row.anomalia; */

    this.seguidorViewService.anomaliaSelected = row.anomalia;
    // this.anomaliasControlService.setExternalStyle(row.id, true);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
