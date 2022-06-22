import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { combineLatest, Subscription } from 'rxjs';

import { GLOBAL } from '@data/constants/global';
import { SeguidoresControlService } from '@data/services/seguidores-control.service';
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
  viewSelected = 0;
  dataSource: MatTableDataSource<AnomaliaData>;
  displayedColumns = ['numAnom', 'tipo', 'perdidas', 'tempMax', 'gradiente'];

  private subscriptions: Subscription = new Subscription();

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private seguidoresControlService: SeguidoresControlService,
    private seguidorViewService: SeguidorViewService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      combineLatest([
        this.seguidoresControlService.seguidorSelected$,
        this.seguidorViewService.seguidorViewSelected$,
      ]).subscribe(([seguidor, view]) => {
        this.seguidorSelected = seguidor;
        this.viewSelected = view;

        if (this.seguidorSelected !== undefined && this.seguidorSelected !== null) {
          let anomalias;
          // tslint:disable-next-line: triple-equals
          if (this.viewSelected != 1) {
            anomalias = seguidor.anomaliasCliente;
          } else {
            // tslint:disable-next-line: triple-equals
            anomalias = seguidor.anomaliasCliente.filter((anom) => anom.tipo == 8 || anom.tipo == 9);
          }

          // vaciamos el datasource
          this.dataSource = undefined;

          // marcamos la nueva seleccionada
          this.seguidorViewService.anomaliaSelected = anomalias[0];

          if (anomalias.length > 0) {
            const anomaliasTabla = [];
            anomalias.forEach((anom) => {
              let perdidas;
              if (anom.perdidas !== undefined) {
                perdidas = anom.perdidas * 100 + '%';
              }
              let tempMax;
              if (anom.temperaturaMax !== undefined) {
                tempMax = anom.temperaturaMax + 'ºC';
              }
              let gradiente;
              if (anom.gradienteNormalizado !== undefined) {
                gradiente = anom.gradienteNormalizado + 'ºC';
              }
              anomaliasTabla.push({
                numAnom: anom.numAnom,
                tipo: GLOBAL.pcDescripcion[anom.tipo],
                perdidas,
                tempMax,
                gradiente,
                anomalia: anom,
              });
            });
            this.dataSource = new MatTableDataSource(anomaliasTabla);
            this.dataSource.sort = this.sort;
          }
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
    if (this.dataSource !== undefined) {
      this.dataSource.sort = this.sort;
    }
  }

  hoverAnomalia(row: any) {
    if (this.anomaliaSelected !== row.anomalia) {
      this.seguidorViewService.anomaliaHovered = row.anomalia;
      this.seguidorViewService.setAnomaliaHoveredStyle(row.anomalia, true);
    }
  }

  unhoverAnomalia(row: any) {
    if (this.anomaliaSelected !== row.anomalia) {
      this.seguidorViewService.anomaliaHovered = undefined;
      this.seguidorViewService.setAnomaliaHoveredStyle(row.anomalia, false);
    }
  }

  selectAnomalia(row: any) {
    // quitamos el hover del seguidor
    this.seguidorViewService.anomaliaHovered = undefined;

    // seleccionamos la anterior seleccionada como previa
    this.seguidorViewService.prevAnomaliaSelected = this.anomaliaSelected;

    this.seguidorViewService.anomaliaSelected = row.anomalia;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
