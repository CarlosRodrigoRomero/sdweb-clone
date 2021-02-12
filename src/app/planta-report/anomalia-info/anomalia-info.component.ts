import { Component, Input, OnInit } from '@angular/core';
import { Anomalia } from '@core/models/anomalia';
import { GLOBAL } from '../../core/services/global';
import { AnomaliaService } from '../../core/services/anomalia.service';
import { FindValueSubscriber } from 'rxjs/internal/operators/find';

@Component({
  selector: 'app-anomalia-info',
  templateUrl: './anomalia-info.component.html',
  styleUrls: ['./anomalia-info.component.css'],
})
export class AnomaliaInfoComponent implements OnInit {
  @Input() anomalia: Anomalia;
  public displayedColumns: string[] = ['clase', 'tipo', 'tempMax', 'gradienteNormalizado', 'perdidas'];
  public dataSource: Anomalia[];
  public editable = false;
  public dataType: any;
  public pcDescripcion: string[];

  constructor(private anomaliaService: AnomaliaService) {}

  ngOnInit(): void {
    this.pcDescripcion = GLOBAL.pcDescripcion;
    this.dataSource = [this.anomalia];
    this.dataType = {
      clase: 'number',
      tipo: 'number',
      gradienteNormalizado: 'number',
      perdidas: 'number',
    };
  }
  onEdit(event, anomalia: Anomalia, field: string) {
    anomalia[field] = event.target.value;
    this.anomaliaService.updateAnomalia(anomalia);
  }
  deleteAnomalia(anomalia: Anomalia) {
    console.log('anom', anomalia);
  }
}
