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
  colorsLeftNodes: any[] = [];
  colorsRightNodes: any[] = [];
  colors_nodes = [];
  chartOptions = {
    width: '100%',
    height: 500,
    interactivity: true,
    sankey: {
      node: {
        nodePadding: 16,
        width: 10,
        colors: this.colors_nodes,
        label: { fontSize: 12, color: '#fff', bold: false, italic: false },
      },
      link: {
        // color: {
        //   // fill: '#efd', // Color of the link.
        //   fillOpacity: 0.8, // Transparency of the link.
        //   // stroke: 'black', // Color of the link border.
        //   // strokeWidth: 1, // Thickness of the link border (default 0).
        // },
        colors: this.colors_nodes,
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
    this.loadData();

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

    GLOBAL.sortedAnomsTipos.forEach((tipo, index) => {
      const anomsTipo = lastReportAnoms.filter((anom) => anom.tipo === tipo);

      if (anomsTipo.length > 0) {
        // checkeamos si el color se ha añadido ya y si no lo añadimos
        this.addLeftColor(index, tipo);

        const uniqueNextTipos = MathOperations.getUniqueElemsArray(anomsTipo.map((anom) => anom.tipoNextYear));

        if (uniqueNextTipos.length > 0) {
          uniqueNextTipos.forEach((uniqueNextTipo, i) => {
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
                // agregamos un espacio porque un diagrama sankey no acepta ir de un un nodo a otro con el mismo nombre
                const to = res + ' ';

                this.chartData.push([from, to, count]);
              });

            // checkeamos si el color se ha añadido ya y si no lo añadimos
            this.addRightColor(index, i, uniqueNextTipo);
          });
        }
      }
    });

    // formamos el array de colores
    this.unifyColors();
  }

  private addLeftColor(index: number, tipo: number) {
    const color = Colors.rgbaToHex(COLOR.colores_tipos[tipo]);
    this.colorsLeftNodes.push({
      index,
      color,
    });
  }

  private addRightColor(indexLeft: number, index: number, tipo: number) {
    const color = Colors.rgbaToHex(COLOR.colores_tipos[tipo]);

    if (!this.colorsRightNodes.some((node) => node.color === color)) {
      this.colorsRightNodes.push({
        indexLeft,
        index,
        color,
      });
    }
  }

  private unifyColors() {
    this.colorsLeftNodes.forEach((leftNode) => {
      // Add the color from the left node
      this.colors_nodes.push(leftNode.color);

      // Find and add the colors from the right nodes with the same indexLeft
      let rightColors = this.colorsRightNodes
        .filter((rightNode) => rightNode.indexLeft === leftNode.index)
        .map((node) => node.color);

      this.colors_nodes.push(...rightColors);
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
}
