import { Component, OnDestroy, OnInit } from '@angular/core';

import { MatSliderChange } from '@angular/material/slider';

import { Subscription } from 'rxjs';

import VectorLayer from 'ol/layer/Vector';

import { MapSeguidoresService } from '../../services/map-seguidores.service';
import { OlMapService } from '@core/services/ol-map.service';

@Component({
  selector: 'app-slider-opacity',
  templateUrl: './slider-opacity.component.html',
  styleUrls: ['./slider-opacity.component.scss'],
})
export class SliderOpacityComponent implements OnInit, OnDestroy {
  private seguidorLayers: VectorLayer[];
  private layerSelected: number;

  private subscriptions: Subscription = new Subscription();

  constructor(private mapSeguidoresService: MapSeguidoresService, private olMapService: OlMapService) {}

  ngOnInit(): void {
    this.subscriptions.add(this.olMapService.getSeguidorLayers().subscribe((layers) => (this.seguidorLayers = layers)));

    this.subscriptions.add(
      this.mapSeguidoresService.layerSelected$.subscribe((layerSel) => (this.layerSelected = layerSel))
    );

    this.subscriptions.add(
      this.mapSeguidoresService.sliderOpacity$.subscribe((value) => {
        this.seguidorLayers.find((layer, index) => {
          if (index === this.layerSelected) {
            layer.setOpacity(value / 100);
          }
        });
      })
    );
  }

  onChangeThermalOpacitySlider(e: MatSliderChange) {
    this.mapSeguidoresService.sliderOpacity = e.value;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
