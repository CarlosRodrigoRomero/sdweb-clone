import { Component, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { AutogeoService } from '@core/services/autogeo.service';

@Component({
  selector: 'app-autogeo',
  templateUrl: './autogeo.component.html',
  styleUrls: ['./autogeo.component.css'],
})
export class AutogeoComponent implements OnInit {
  mapLoaded = false;

  private subscriptions: Subscription = new Subscription();

  constructor(private autogeoService: AutogeoService) {}

  ngOnInit(): void {
    this.subscriptions.add(this.autogeoService.mapLoaded$.subscribe((loaded) => (this.mapLoaded = loaded)));
  }
}
