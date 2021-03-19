import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Anomalia } from '@core/models/anomalia';
import { GLOBAL } from '@core/services/global';

@Component({
  selector: 'app-anomalia-info',
  templateUrl: './anomalia-info.component.html',
  styleUrls: ['./anomalia-info.component.css'],
})
export class AnomaliaInfoComponent implements OnInit, OnChanges {
  @Input() anomaliaSelect: Anomalia;
  @Input() anomaliaHover: Anomalia;
  public displayedColumns: string[] = ['clase', 'tipo', 'tempMax', 'gradienteNormalizado', 'perdidas'];
  public dataSource: Anomalia[];
  public dataType: any;
  public pcDescripcion: string[];
  public anomaliaHoverPrev: Anomalia;

  constructor() {}

  ngOnInit(): void {
    this.pcDescripcion = GLOBAL.pcDescripcion;
    this.dataSource = [this.anomaliaHover];
    this.dataType = {
      clase: 'number',
      tipo: 'number',
      gradienteNormalizado: 'number',
      perdidas: 'number',
    };
  }

  ngOnChanges() {
    // si hay una anomalia seleccionada deja de aparecer en el hover
    if (this.anomaliaSelect === undefined) {
      this.anomaliaHoverPrev = this.anomaliaHover;
      this.dataSource = [this.anomaliaHover];
    }
    this.dataSource = [this.anomaliaSelect];
  }
}
