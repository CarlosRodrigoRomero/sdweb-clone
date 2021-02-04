import { AfterViewInit, Component, ElementRef, Input, OnInit } from '@angular/core';

import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { OSM } from 'ol/source';
import { Tile as TileLayer } from 'ol/layer';
import * as Proj from 'ol/proj.js';
import { defaults as defaultControls } from 'ol/control.js';

import { AuthService } from '@core/services/auth.service';
import { PlantaService } from '@core/services/planta.service';

import { PlantaInterface } from '@core/models/planta';

export const DEFAULT_HEIGHT = '500px';
export const DEFAULT_WIDTH = '500px';

export const DEFAULT_LAT = 40;
export const DEFAULT_LON = -4;

@Component({
  selector: 'app-map-all-plants',
  templateUrl: './map-all-plants.component.html',
  styleUrls: ['./map-all-plants.component.css'],
})
export class MapAllPlantsComponent implements OnInit, AfterViewInit {
  plantas: PlantaInterface[];

  @Input() lat: number = DEFAULT_LAT;
  @Input() lon: number = DEFAULT_LON;
  @Input() zoom: number;
  @Input() width: string | number = DEFAULT_WIDTH;
  @Input() height: string | number = DEFAULT_HEIGHT;

  target: string = 'map-' + Math.random().toString(36).substring(2);
  map: Map;

  private mapEl: HTMLElement;

  constructor(private plantaService: PlantaService, public auth: AuthService, private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.auth.user$.subscribe((user) =>
      this.plantaService.getPlantasDeEmpresa(user).subscribe((plantas) => (this.plantas = plantas))
    );
  }

  ngAfterViewInit() {
    this.mapEl = this.elementRef.nativeElement.querySelector('#' + this.target);
    this.setSize();

    this.map = new Map({
      target: this.target,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: Proj.fromLonLat([this.lon, this.lat]),
        zoom: this.zoom,
      }),
      controls: defaultControls({ attribution: false, zoom: false }).extend([]),
    });
  }

  private setSize() {
    if (this.mapEl) {
      const styles = this.mapEl.style;
      styles.height = coerceCssPixelValue(this.height) || DEFAULT_HEIGHT;
      styles.width = coerceCssPixelValue(this.width) || DEFAULT_WIDTH;
    }
  }

  clickedMarker(label: string, index: number) {
    console.log(`clicked the marker: ${label || index}`);
  }
}

const cssUnitsPattern = /([A-Za-z%]+)$/;

function coerceCssPixelValue(value: any): string {
  if (value == null) {
    return '';
  }

  return cssUnitsPattern.test(value) ? value : `${value}px`;
}
