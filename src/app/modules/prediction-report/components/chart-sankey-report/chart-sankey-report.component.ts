import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { Subscription } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

import { GoogleCharts } from 'google-charts';

import { ThemeService } from '@data/services/theme.service';
import { ReportControlService } from '@data/services/report-control.service';

import { MathOperations } from '@core/classes/math-operations';
import { Colors } from '@core/classes/colors';

import { GLOBAL } from '@data/constants/global';
import { COLOR } from '@data/constants/color';
import { switchMap, take } from 'rxjs/operators';

@Component({
  selector: 'app-chart-sankey-report',
  templateUrl: './chart-sankey-report.component.html',
  styleUrls: ['./chart-sankey-report.component.css'],
})
export class ChartSankeyReportComponent implements OnInit {
  lightOrange = COLOR.dark_orange;
  @ViewChild('sankeyChart', { static: true }) sankeyChartElement: ElementRef;

  chartData: any[][] = [['From', 'To', '#']];
  colors_nodes = [];
  colors = {
    'Módulo en CA (string)': 'red',
    '2x Substring CA': 'yellow',
    'Substring en CA': 'orange',
    'Módulo en CC': 'blue',
    'PID regular': 'black',
  };
  chartOptions = {
    width: '100%',
    height: 400,
    interactivity: true,
    sankey: {
      node: {
        nodePadding: 16,
        width: 10,
        colors: [COLOR.dark_orange],
        label: { fontSize: 12, color: '#fff', bold: false, italic: false },
      },
      link: {
        // color: {
        //   // fill: '#efd', // Color of the link.
        //   fillOpacity: 0.8, // Transparency of the link.
        //   // stroke: 'black', // Color of the link border.
        //   // strokeWidth: 1, // Thickness of the link border (default 0).
        // },
        colors: [COLOR.neutralGrey],
        colorMode: 'gradient',
      },
    },
    tooltip: {
      textStyle: {
        fontSize: 12,
      },
      showColorCode: true,
    },
  };

  private subscriptions: Subscription = new Subscription();

  constructor(
    private themeService: ThemeService,
    private reportControlService: ReportControlService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // this.loadData();

    // this.setChartHeight();

    // this.setColors();

    this.loadFakeData();

    this.loadChart();

    this.subscriptions.add(
      this.themeService.themeSelected$.subscribe((theme) => {
        if (this.chartOptions) {
          this.chartOptions.sankey.node.label.color = this.themeService.textColor;

          this.loadChart();
        }
      })
    );
  }

  private loadData() {
    const lastReport = this.reportControlService.informes[this.reportControlService.informes.length - 1];
    const lastReportAnoms = this.reportControlService.allAnomalias.filter((anom) => anom.informeId === lastReport.id);

    // DEMO
    // lastReportAnoms.forEach((anom) => {
    //   anom.tipoNextYear = this.tipoRandom();
    // });

    GLOBAL.sortedAnomsTipos.forEach((tipo, index) => {
      const anomsTipo = lastReportAnoms.filter((anom) => anom.tipo === tipo);

      if (anomsTipo.length > 0) {
        const uniqueNextTipos = MathOperations.getUniqueElemsArray(anomsTipo.map((anom) => anom.tipoNextYear));

        if (uniqueNextTipos.length > 0) {
          // checkeamos si el color se ha añadido ya y si no lo añadimos
          // this.addColor(tipo);

          uniqueNextTipos.forEach((uniqueNextTipo) => {
            const anomsTipoNext = anomsTipo.filter((anom) => anom.tipoNextYear === uniqueNextTipo);
            const count = anomsTipoNext.length;
            let from: string;

            this.translate
              .get(GLOBAL.labels_tipos[tipo])
              .pipe(
                take(1),
                switchMap((res: string) => {
                  from = res;

                  return this.translate.get(GLOBAL.labels_tipos[uniqueNextTipo]);
                }),
                take(1)
              )
              .subscribe((res: string) => {
                const to = res;

                this.chartData.push([from, to, count]);
              });

            // const from = GLOBAL.labels_tipos[tipo];
            // const to = GLOBAL.labels_tipos[uniqueNextTipo];
            // console.log(from, to, count);

            // checkeamos si el color se ha añadido ya y si no lo añadimos
            // this.addColor(uniqueNextTipo);
          });
        }
      }
    });
  }

  private loadFakeData() {
    const data = [
      ['PID fase temprana', 'PID fase temprana.', 1399],
      ['Módulo en CA (string)', 'Módulo en CA (string).', 140],
      ['2x Substring CA', '2x Substring CA.', 2],
      ['Substring en CA', 'Substring en CA.', 62],
      ['Módulo en CC', 'Módulo en CC.', 1],
      ['Caja conexiones', 'Caja conexiones.', 16],
      ['Sombras', 'Sombras.', 37],
      ['Nuevas', 'Substring en CA.', 7],
      ['Nuevas', 'Caja conexiones.', 2],
      ['Nuevas', 'Módulo en CA (string).', 10],
      ['Nuevas', 'PID fase temprana.', 50],
    ];

    data.forEach((row) => {
      const translateData = [];
      this.translate.get(row[0] as string).subscribe((res: string) => {
        translateData.push(res);
        this.translate.get((row[1] as string).slice(0, -1)).subscribe((res2: string) => {
          translateData.push(res2 + '.');
          translateData.push(row[2]);
          this.chartData.push(translateData);
        });
      });
    });
  }

  private setChartHeight() {
    const numRows = this.chartData.length - 1;
    const height = numRows * 16;

    this.chartOptions.height = height;
  }

  private addColor(tipo: number) {
    const color = Colors.rgbaToHex(COLOR.colores_tipos[tipo]);
    if (!this.colors_nodes.includes(color)) {
      this.colors_nodes.push(color);
    }
  }

  private setColors() {
    const nodes: string[] = [];
    const colors: any[] = [];

    // añadimos primero los nodos de la izquierda
    this.chartData
      .filter((_, index) => index > 0)
      .map((row) => row[0])
      .forEach((from) => {
        if (!nodes.includes(from)) {
          nodes.push(from);
        }
      });

    // después los de la derecha
    this.chartData
      .filter((_, index) => index > 0)
      .map((row) => row[1])
      .forEach((from) => {
        if (!nodes.includes(from)) {
          nodes.push(from);
        }
      });

    // añadimos los colores
    nodes.forEach((node) => {
      const tipo = GLOBAL.labels_tipos.indexOf(node);
      const color = Colors.rgbaToHex(COLOR.colores_tipos[tipo]);
      this.colors_nodes.push(color);
    });
  }

  private loadChart() {
    GoogleCharts.load(() => this.drawChart(), { packages: ['sankey'] });
  }

  private drawChart() {
    const chart = new GoogleCharts.api.visualization.Sankey(this.sankeyChartElement.nativeElement);
    const dataTable = new GoogleCharts.api.visualization.arrayToDataTable(this.chartData);
    chart.draw(dataTable, this.chartOptions);
  }

  private tipoRandom(): number {
    // Crea un array con los números 4, 8, 9 y 10
    var numeros = [4, 12, 20, 21];

    // Genera un número aleatorio entre los elementos del array
    var indiceAleatorio = Math.floor(Math.random() * numeros.length);
    return numeros[indiceAleatorio];
  }
}
