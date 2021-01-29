import { Component, OnInit } from '@angular/core';
import { MapControlService } from '../services/map-control.service';
import { Options } from '@angular-slider/ngx-slider';

@Component({
  selector: 'app-map-control',
  templateUrl: './map-control.component.html',
  styleUrls: ['./map-control.component.css'],
})
export class MapControlComponent implements OnInit {
  lowValue: number = 25;
  highValue: number = 70;
  options: Options = {
    floor: 25,
    ceil: 100,
  };

  constructor(private mapControlService: MapControlService) {}

  ngOnInit(): void {}
  onChangeSlider(highValue: number, lowValue: number) {
    this.mapControlService.sliderMax = highValue;
    this.mapControlService.sliderMin = lowValue;
  }
}
