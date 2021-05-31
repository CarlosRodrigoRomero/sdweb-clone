import { Component, OnInit } from '@angular/core';
import { GLOBAL } from '@core/services/global';

@Component({
  selector: 'app-anom-tipo-legend',
  templateUrl: './anom-tipo-legend.component.html',
  styleUrls: ['./anom-tipo-legend.component.css'],
})
export class AnomTipoLegendComponent implements OnInit {
  tiposAnomalia: string[] = undefined;

  constructor() {}

  ngOnInit(): void {
    this.tiposAnomalia = GLOBAL.labels_tipos;
  }
}
