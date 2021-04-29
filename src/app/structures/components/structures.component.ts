import { Component, OnInit } from '@angular/core';

import { StructuresService } from '@core/services/structures.service';

@Component({
  selector: 'app-structures',
  templateUrl: './structures.component.html',
  styleUrls: ['./structures.component.css'],
})
export class StructuresComponent implements OnInit {
  serviceInit = false;

  constructor(private structuresService: StructuresService) {}

  ngOnInit(): void {
    this.structuresService.initService().subscribe((value) => (this.serviceInit = value));
  }
}
