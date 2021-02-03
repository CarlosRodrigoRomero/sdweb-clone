import { Component, OnInit } from '@angular/core';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { Label } from 'ng2-charts';

import { AuthService } from '@core/services/auth.service';
import { PlantaService } from '@core/services/planta.service';

import { PlantaInterface } from '@core/models/planta';

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css'],
})
export class BarChartComponent implements OnInit {
  public barChartOptions: ChartOptions = {
    responsive: true,
    // We use these empty structures as placeholders for dynamic theming.
    scales: { xAxes: [{}], yAxes: [{}] },
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'end',
      },
    },
  };
  public barChartLabels: Label[] = [];
  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public color: Array<any> = [
    {
      // red
      backgroundColor: '#D32F2F',
    },
  ];

  public barChartData: ChartDataSets[];

  data: number[] = [];

  plantas: PlantaInterface[];

  constructor(private plantaService: PlantaService, public auth: AuthService) {}

  ngOnInit(): void {
    this.auth.user$.subscribe((user) =>
      this.plantaService.getPlantasDeEmpresa(user).subscribe((plantas) =>
        plantas.forEach((planta) => {
          if (planta.informes !== undefined && planta.informes.length > 0) {
            this.data.push(
              planta.informes.reduce((prev, current) => (prev.fecha > current.fecha ? prev : current)).mae
            );
            this.barChartLabels.push(planta.nombre);
          }
        })
      )
    );
    this.barChartData = [{ data: this.data, label: '2020' }];
  }

  // events
  public chartClicked({ event, active }: { event: MouseEvent; active: {}[] }): void {
    console.log(event, active);
  }

  public chartHovered({ event, active }: { event: MouseEvent; active: {}[] }): void {
    console.log(event, active);
  }
}
