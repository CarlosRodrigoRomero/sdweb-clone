import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import * as d3 from 'd3';
import * as d3Sankey from 'd3-sankey';

import { data } from './data';

interface Node extends d3Sankey.SankeyNodeMinimal<{}, {}> {
  name: string;
  category: string;
}

interface Link extends d3Sankey.SankeyLinkMinimal<Node, {}> {
  value: number;
}

@Component({
  selector: 'app-chart-sankey-prediction',
  templateUrl: './chart-sankey-prediction.component.html',
  styleUrls: ['./chart-sankey-prediction.component.css'],
})
export class ChartSankeyPredictionComponent implements AfterViewInit {
  @ViewChild('chart')
  private chartContainer: ElementRef;
  private idCounter = 0;

  ngAfterViewInit(): void {
    this.createSankeyChart();
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
      nodes: data.nodes.map((d) => Object.assign({}, d)),
      links: data.links.map((d) => Object.assign({}, d)),
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
