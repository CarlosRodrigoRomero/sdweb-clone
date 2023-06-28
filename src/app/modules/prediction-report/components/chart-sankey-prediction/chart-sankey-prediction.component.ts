import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import * as d3 from 'd3';
import * as d3Sankey from 'd3-sankey';

interface Node extends d3Sankey.SankeyNodeMinimal<{}, {}> {
  name: string;
  category: string;
}

interface Link extends d3Sankey.SankeyLinkMinimal<Node, {}> {
  value: number;
}

interface SNodeExtra {
  nodeId: number;
  name: string;
}

interface SLinkExtra {
  source: number;
  target: number;
  value: number;
  uom: string;
}

type SNode = d3Sankey.SankeyNode<SNodeExtra, SLinkExtra>;
type SLink = d3Sankey.SankeyLink<SNodeExtra, SLinkExtra>;

interface DAG {
  nodes: SNode[];
  links: SLink[];
}

@Component({
  selector: 'app-chart-sankey-prediction',
  templateUrl: './chart-sankey-prediction.component.html',
  styleUrls: ['./chart-sankey-prediction.component.css'],
})
export class ChartSankeyPredictionComponent implements OnInit {
  @ViewChild('chart')
  private chartContainer: ElementRef;
  private idCounter = 0;
  private data: { nodes: Node[]; links: Link[] } = {
    nodes: [
      { name: "Agricultural 'waste'", category: 'Agricultural' },
      { name: 'Bio-conversion', category: 'Bio-conversion' },
      { name: 'Liquid', category: 'Liquid' },
      { name: 'Losses', category: 'Losses' },
      { name: 'Solid', category: 'Solid' },
      { name: 'Gas', category: 'Gas' },
      { name: 'Biofuel imports', category: 'Biofuel' },
      { name: 'Biomass imports', category: 'Biomass' },
      { name: 'Coal imports', category: 'Coal' },
      { name: 'Coal', category: 'Coal' },
      { name: 'Coal reserves', category: 'Coal' },
      { name: 'District heating', category: 'District' },
      { name: 'Industry', category: 'Industry' },
      { name: 'Heating and cooling - commercial', category: 'Heating' },
      { name: 'Heating and cooling - homes', category: 'Heating' },
      { name: 'Electricity grid', category: 'Electricity' },
      { name: 'Over generation / exports', category: 'Over' },
      { name: 'H2 conversion', category: 'H2' },
      { name: 'Road transport', category: 'Road' },
      { name: 'Agriculture', category: 'Agriculture' },
      { name: 'Rail transport', category: 'Rail' },
      { name: 'Lighting & appliances - commercial', category: 'Lighting' },
      { name: 'Lighting & appliances - homes', category: 'Lighting' },
      { name: 'Gas imports', category: 'Gas' },
      { name: 'Ngas', category: 'Ngas' },
      { name: 'Gas reserves', category: 'Gas' },
      { name: 'Thermal generation', category: 'Thermal' },
      { name: 'Geothermal', category: 'Geothermal' },
      { name: 'H2', category: 'H2' },
      { name: 'Hydro', category: 'Hydro' },
      { name: 'International shipping', category: 'International' },
      { name: 'Domestic aviation', category: 'Domestic' },
      { name: 'International aviation', category: 'International' },
      { name: 'National navigation', category: 'National' },
      { name: 'Marine algae', category: 'Marine' },
      { name: 'Nuclear', category: 'Nuclear' },
      { name: 'Oil imports', category: 'Oil' },
      { name: 'Oil', category: 'Oil' },
      { name: 'Oil reserves', category: 'Oil' },
      { name: 'Other waste', category: 'Other' },
      { name: 'Pumped heat', category: 'Pumped' },
      { name: 'Solar PV', category: 'Solar' },
      { name: 'Solar Thermal', category: 'Solar' },
      { name: 'Solar', category: 'Solar' },
      { name: 'Tidal', category: 'Tidal' },
      { name: 'UK land based bioenergy', category: 'UK' },
      { name: 'Wave', category: 'Wave' },
      { name: 'Wind', category: 'Wind' },
    ],
    links: [
      { source: "Agricultural 'waste'", target: 'Bio-conversion', value: 124.729 },
      { source: 'Bio-conversion', target: 'Liquid', value: 0.597 },
      { source: 'Bio-conversion', target: 'Losses', value: 26.862 },
      { source: 'Bio-conversion', target: 'Solid', value: 280.322 },
      { source: 'Bio-conversion', target: 'Gas', value: 81.144 },
      { source: 'Biofuel imports', target: 'Liquid', value: 35 },
      { source: 'Biomass imports', target: 'Solid', value: 35 },
      { source: 'Coal imports', target: 'Coal', value: 11.606 },
      { source: 'Coal reserves', target: 'Coal', value: 63.965 },
      { source: 'Coal', target: 'Solid', value: 75.571 },
      { source: 'District heating', target: 'Industry', value: 10.639 },
      { source: 'District heating', target: 'Heating and cooling - commercial', value: 22.505 },
      { source: 'District heating', target: 'Heating and cooling - homes', value: 46.184 },
      { source: 'Electricity grid', target: 'Over generation / exports', value: 104.453 },
      { source: 'Electricity grid', target: 'Heating and cooling - homes', value: 113.726 },
      { source: 'Electricity grid', target: 'H2 conversion', value: 27.14 },
      { source: 'Electricity grid', target: 'Industry', value: 342.165 },
      { source: 'Electricity grid', target: 'Road transport', value: 37.797 },
      { source: 'Electricity grid', target: 'Agriculture', value: 4.412 },
      { source: 'Electricity grid', target: 'Heating and cooling - commercial', value: 40.858 },
      { source: 'Electricity grid', target: 'Losses', value: 56.691 },
      { source: 'Electricity grid', target: 'Rail transport', value: 7.863 },
      { source: 'Electricity grid', target: 'Lighting & appliances - commercial', value: 90.008 },
      { source: 'Electricity grid', target: 'Lighting & appliances - homes', value: 93.494 },
      { source: 'Gas imports', target: 'Ngas', value: 40.719 },
      { source: 'Gas reserves', target: 'Ngas', value: 82.233 },
      { source: 'Gas', target: 'Heating and cooling - commercial', value: 0.129 },
      { source: 'Gas', target: 'Losses', value: 1.401 },
      { source: 'Gas', target: 'Thermal generation', value: 151.891 },
      { source: 'Gas', target: 'Agriculture', value: 2.096 },
      { source: 'Gas', target: 'Industry', value: 48.58 },
      { source: 'Geothermal', target: 'Electricity grid', value: 7.013 },
      { source: 'H2 conversion', target: 'H2', value: 20.897 },
      { source: 'H2 conversion', target: 'Losses', value: 6.242 },
      { source: 'H2', target: 'Road transport', value: 20.897 },
      { source: 'Hydro', target: 'Electricity grid', value: 6.995 },
      { source: 'Liquid', target: 'Industry', value: 121.066 },
      { source: 'Liquid', target: 'International shipping', value: 128.69 },
      { source: 'Liquid', target: 'Road transport', value: 135.835 },
      { source: 'Liquid', target: 'Domestic aviation', value: 14.458 },
      { source: 'Liquid', target: 'International aviation', value: 206.267 },
      { source: 'Liquid', target: 'Agriculture', value: 3.64 },
      { source: 'Liquid', target: 'National navigation', value: 33.218 },
      { source: 'Liquid', target: 'Rail transport', value: 4.413 },
      { source: 'Marine algae', target: 'Bio-conversion', value: 4.375 },
      { source: 'Ngas', target: 'Gas', value: 122.952 },
      { source: 'Nuclear', target: 'Thermal generation', value: 839.978 },
      { source: 'Oil imports', target: 'Oil', value: 504.287 },
      { source: 'Oil reserves', target: 'Oil', value: 107.703 },
      { source: 'Oil', target: 'Liquid', value: 611.99 },
      { source: 'Other waste', target: 'Solid', value: 56.587 },
      { source: 'Other waste', target: 'Bio-conversion', value: 77.81 },
      { source: 'Pumped heat', target: 'Heating and cooling - homes', value: 193.026 },
      { source: 'Pumped heat', target: 'Heating and cooling - commercial', value: 70.672 },
      { source: 'Solar PV', target: 'Electricity grid', value: 59.901 },
      { source: 'Solar Thermal', target: 'Heating and cooling - homes', value: 19.263 },
      { source: 'Solar', target: 'Solar Thermal', value: 19.263 },
      { source: 'Solar', target: 'Solar PV', value: 59.901 },
      { source: 'Solid', target: 'Agriculture', value: 0.882 },
      { source: 'Solid', target: 'Thermal generation', value: 400.12 },
      { source: 'Solid', target: 'Industry', value: 46.477 },
      { source: 'Thermal generation', target: 'Electricity grid', value: 525.531 },
      { source: 'Thermal generation', target: 'Losses', value: 787.129 },
      { source: 'Thermal generation', target: 'District heating', value: 79.329 },
      { source: 'Tidal', target: 'Electricity grid', value: 9.452 },
      { source: 'UK land based bioenergy', target: 'Bio-conversion', value: 182.01 },
      { source: 'Wave', target: 'Electricity grid', value: 19.013 },
      { source: 'Wind', target: 'Electricity grid', value: 289.366 },
    ],
  };

  constructor() {}

  ngOnInit(): void {
    this.DrawChart();
  }

  ngAfterViewInit(): void {
    this.createSankeyChart();
  }

  private DrawChart() {
    var svg = d3.select('#sankey'),
      width = +svg.attr('width'),
      height = +svg.attr('height');

    var formatNumber = d3.format(',.0f'),
      format = function (d: any) {
        return formatNumber(d) + ' TWh';
      },
      color = d3.scaleOrdinal(d3.schemeCategory10);

    var sankey = d3Sankey
      .sankey()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([
        [1, 1],
        [width - 1, height - 6],
      ]);

    var link = svg
      .append('g')
      .attr('class', 'links')
      .attr('fill', 'none')
      .attr('stroke', '#000')
      .attr('stroke-opacity', 0.2)
      .selectAll('path');

    var node = svg
      .append('g')
      .attr('class', 'nodes')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .selectAll('g');

    //d3.json("./energy.json", function (error, energy: any) {
    //if (error) throw error;

    const energy: DAG = {
      nodes: [
        {
          nodeId: 0,
          name: 'node0',
        },
        {
          nodeId: 1,
          name: 'node1',
        },
        {
          nodeId: 2,
          name: 'node2',
        },
        {
          nodeId: 3,
          name: 'node3',
        },
        {
          nodeId: 4,
          name: 'node4',
        },
      ],
      links: [
        {
          source: 0,
          target: 2,
          value: 2,
          uom: 'Widget(s)',
        },
        {
          source: 1,
          target: 2,
          value: 2,
          uom: 'Widget(s)',
        },
        {
          source: 1,
          target: 3,
          value: 2,
          uom: 'Widget(s)',
        },
        {
          source: 0,
          target: 4,
          value: 2,
          uom: 'Widget(s)',
        },
        {
          source: 2,
          target: 3,
          value: 2,
          uom: 'Widget(s)',
        },
        {
          source: 2,
          target: 4,
          value: 2,
          uom: 'Widget(s)',
        },
        {
          source: 3,
          target: 4,
          value: 4,
          uom: 'Widget(s)',
        },
      ],
    };

    sankey(energy);

    link = link
      .data(energy.links)
      .enter()
      .append('path')
      .attr('d', d3Sankey.sankeyLinkHorizontal())
      .attr('stroke-width', function (d: any) {
        return Math.max(1, d.width);
      });

    link.append('title').text(function (d: any) {
      return d.source.name + ' → ' + d.target.name + '\n' + format(d.value);
    });

    node = node.data(energy.nodes).enter().append('g');

    node
      .append('rect')
      .attr('x', function (d: any) {
        return d.x0;
      })
      .attr('y', function (d: any) {
        return d.y0;
      })
      .attr('height', function (d: any) {
        return d.y1 - d.y0;
      })
      .attr('width', function (d: any) {
        return d.x1 - d.x0;
      })
      .attr('fill', function (d: any) {
        return color(d.name.replace(/ .*/, ''));
      })
      .attr('stroke', '#000');

    node
      .append('text')
      .attr('x', function (d: any) {
        return d.x0 - 6;
      })
      .attr('y', function (d: any) {
        return (d.y1 + d.y0) / 2;
      })
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .text(function (d: any) {
        return d.name;
      })
      .filter(function (d: any) {
        return d.x0 < width / 2;
      })
      .attr('x', function (d: any) {
        return d.x1 + 6;
      })
      .attr('text-anchor', 'start');

    node.append('title').text(function (d: any) {
      return d.name + '\n' + format(d.value);
    });
    //});
  }

  private createSankeyChart() {
    const element = this.chartContainer.nativeElement;

    const nodeAlign = 'justify';
    const linkColor = 'source-target';
    const format = d3.format(',.0f');

    // Define the dimensions of the chart
    const width = 600;
    const height = 400;

    // Create the SVG container
    const svg = d3
      .select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Define the Sankey diagram properties
    const sankey = d3Sankey
      .sankey()
      .nodeId((d: any) => d.name)
      .nodeAlign(d3[nodeAlign])
      .nodeWidth(15)
      .nodePadding(10)
      .extent([
        [1, 1],
        [width - 1, height - 6],
      ]);

    // Apply the Sankey diagram function to the data
    const { nodes, links } = sankey({
      nodes: this.data.nodes.map((d) => Object.assign({}, d)),
      links: this.data.links.map((d) => Object.assign({}, d)),
    });

    // Define the color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Add the rectangles for the nodes
    const rect = svg
      .append('g')
      .attr('stroke', '#000')
      .selectAll('rect')
      .data(nodes)
      .join('rect')
      .attr('x', (d) => d.x0)
      .attr('y', (d) => d.y0)
      .attr('height', (d) => d.y1 - d.y0)
      .attr('width', (d) => d.x1 - d.x0)
      .attr('fill', (d) => color(d.category));

    // Add titles for the nodes
    rect.append('title').text((d) => `${d.name}\n${format(d.value)}`);

    // Add the links
    const link = svg
      .append('g')
      .attr('fill', 'none')
      .attr('stroke-opacity', 0.5)
      .selectAll('g')
      .data(links)
      .join('g')
      .style('mix-blend-mode', 'multiply');

    // Add gradients for the links
    if (linkColor === 'source-target') {
      const gradient = link
        .append('linearGradient')
        .attr('id', (d) => (d.uid = this.uniqueId('link')))
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', (d) => d.source.x1)
        .attr('x2', (d) => d.target.x0);
      gradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', (d) => color(d.source.category));
      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', (d) => color(d.target.category));
    }

    link
      .append('path')
      .attr('d', d3Sankey.sankeyLinkHorizontal())
      .attr(
        'stroke',
        linkColor === 'source-target'
          ? (d) => d.uid
          : linkColor === 'source'
          ? (d) => color(d.source.category)
          : linkColor === 'target'
          ? (d) => color(d.target.category)
          : linkColor
      )
      .attr('stroke-width', (d) => Math.max(1, d.width));

    // Add titles for the links
    link.append('title').text((d) => `${d.source.name} → ${d.target.name}\n${format(d.value)}`);

    // Add labels for the nodes
    svg
      .append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('x', (d) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
      .attr('y', (d) => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d) => (d.x0 < width / 2 ? 'start' : 'end'))
      .text((d) => d.name);
  }

  private uniqueId(prefix: string) {
    return `${prefix}-${this.idCounter++}`;
  }
}
