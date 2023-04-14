import { AfterViewInit, Component, OnInit } from '@angular/core';

declare let google: any;

@Component({
  selector: 'app-chart-sankey-report',
  templateUrl: './chart-sankey-report.component.html',
  styleUrls: ['./chart-sankey-report.component.css'],
})
export class ChartSankeyReportComponent implements OnInit, AfterViewInit {
  labels = ['Actual', 'Próximo año'];

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    google.charts.load('current', { packages: ['sankey'] });
    google.charts.setOnLoadCallback(this.drawChart);
  }

  drawChart() {
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'From');
    data.addColumn('string', 'To');
    data.addColumn('number', 'Weight');
    data.addRows([
      ['Célula caliente', 'Célula caliente.', 101],
      ['Célula caliente', 'Varias células calientes.', 2],
      ['Célula caliente', 'String', 2],
      ['Varias células calientes', 'Varias células calientes.', 28],
      ['Varias células calientes', 'Substring en CA.', 1],
      ['Substring en CA', 'Substring en CA.', 9],
      ['Substring en CA', '2x Substring en CA.', 2],
      ['Nuevas', 'Célula caliente.', 10],
      ['Nuevas', 'Varias células calientes.', 4],
      ['Nuevas', 'String', 15],
      ['Nuevas', 'Substring en CA.', 1],
      ['Célula caliente', 'unknown', 30],
      ['Varias células calientes', 'unknown', 2],
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
      '#00E396', // 'Célula caliente'
      '#00E396', // 'Célula caliente.',
      '#128254', // 'Varias células calientes.',
      '#FF0000', // 'String',
      '#128254', // 'Varias células calientes',
      '#FEB019', // 'Substring en CA.',
      '#FEB019', // 'Substring en CA',
      '#00BEBE', // '2x Substring en CA.',
      '#474747', // 'Nuevas',
      '#000', // 'Unknown',
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
      width: '100%',
      height: 400,
      interactivity: true,
      sankey: {
        node: {
          nodePadding: 60,
          width: 10,
          colors: colors_nodes,
          label: { fontSize: 14, color: '#fff', bold: false, italic: false },
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
    var chart = new google.visualization.Sankey(document.getElementById('sankey'));
    chart.draw(data, options);
  }
}
