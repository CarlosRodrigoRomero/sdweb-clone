import { Component, OnInit } from '@angular/core';

import { CreateMapService } from '@data/services/create-map.service';

@Component({
  selector: 'app-create-map',
  templateUrl: './create-map.component.html',
  styleUrls: ['./create-map.component.css'],
})
export class CreateMapComponent implements OnInit {
  dataLoaded = false;

  constructor(private createMapService: CreateMapService) {}

  ngOnInit(): void {
    this.createMapService.initService().then((initService) => {
      this.dataLoaded = initService;
    });
  }
}
