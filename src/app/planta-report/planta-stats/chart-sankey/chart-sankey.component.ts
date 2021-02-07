import { Component, OnInit, AfterViewInit } from '@angular/core';
import { GLOBAL } from '@core/services/global';
declare let google;

@Component({
  selector: 'app-chart-sankey',
  templateUrl: './chart-sankey.component.html',
  styleUrls: ['./chart-sankey.component.css'],
})
export class ChartSankeyComponent implements AfterViewInit {
  constructor() {}

  ngAfterViewInit(): void {
    // this.drawChart();
    google.charts.load('current', { packages: ['sankey'] });
    google.charts.setOnLoadCallback(this.drawChart);
  }
  drawChart() {
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'From');
    data.addColumn('string', 'To');
    data.addColumn('number', 'Weight');
    data.addRows([
      ['Célula caliente', 'Célula caliente.', 170],
      ['Célula caliente', 'Varias células calientes.', 26],
      ['Célula caliente', 'String', 2],
      ['Varias células calientes', 'Varias células calientes.', 8],
      ['Varias células calientes', 'Substring en CA.', 1],
      ['Substring en CA', 'Substring en CA.', 9],
      ['Substring en CA', '2x Substring en CA.', 1],
      ['Nuevas', 'Célula caliente.', 20],
      ['Nuevas', 'Varias células calientes.', 4],
      ['Nuevas', 'String', 15],
      ['Nuevas', 'Substring en CA.', 1],
      ['Célula caliente', 'unknown', 25],
    ]);

    // Sets chart options.
    // [
    //   'Célula caliente',
    //   'Célula caliente.',
    //   'Varias células calientes.',
    //   'String',
    //   'Varias células calientes',
    //   'Substring en CA.',
    //   'Substring en CA',
    //   '2x Substring en CA.',
    //   'Nuevas',
    // ];
    const colors_nodes = [
      GLOBAL.colores_tipos_hex[8], // 'Célula caliente',
      GLOBAL.colores_tipos_hex[8], // 'Célula caliente.',
      GLOBAL.colores_tipos_hex[9], // 'Varias células calientes.',
      GLOBAL.colores_tipos_hex[17], // 'String',
      GLOBAL.colores_tipos_hex[9], // 'Varias células calientes',
      GLOBAL.colores_tipos_hex[3], // 'Substring en CA.',
      GLOBAL.colores_tipos_hex[3], // 'Substring en CA',
      GLOBAL.colores_tipos_hex[10], // '2x Substring en CA.',
      '#fff', // 'Nuevas',
      '#fff', // 'Unknown',
    ];
    const colors_link = [
      '#bfbfbf', // 'Célula caliente',
      '#bfbfbf', // 'Célula caliente.',
      '#bfbfbf', // 'Varias células calientes.',
      '#bfbfbf', // 'String',
      '#bfbfbf', // 'Varias células calientes',
      '#bfbfbf', // 'Substring en CA.',
      '#bfbfbf', // 'Substring en CA',
      '#bfbfbf', // '2x Substring en CA.',
      '#fff', // 'Nuevas',
      '#fff', // 'unknown',
    ];

    const options = {
      width: 600,
      interactivity: true,
      sankey: {
        node: {
          nodePadding: 60,
          width: 10,
          colors: colors_nodes,
          label: { fontSize: 14, color: '#000', bold: false, italic: false },
        },
        link: {
          color: {
            // fill: '#efd', // Color of the link.
            fillOpacity: 0.8, // Transparency of the link.
            // stroke: 'black', // Color of the link border.
            // strokeWidth: 1, // Thickness of the link border (default 0).
          },
          colors: colors_nodes,
          colorMode: 'gradient',
        },
      },
    };

    // Instantiates and draws our chart, passing in some options.
    var chart = new google.visualization.Sankey(document.getElementById('sankey_basic'));
    chart.draw(data, options);
  }
}
