import { Component, OnInit } from '@angular/core';

import { StructuresService } from '@core/services/structures.service';

@Component({
  selector: 'app-structures',
  templateUrl: './structures.component.html',
  styleUrls: ['./structures.component.css'],
})
export class StructuresComponent implements OnInit {
  serviceInit = false;
  deleteMode = false;

  constructor(private structuresService: StructuresService) {}

  ngOnInit(): void {
    this.structuresService.initService().subscribe((value) => (this.serviceInit = value));
    this.structuresService.deleteMode$.subscribe((mode) => (this.deleteMode = mode));
  }

  switchDeleteMode() {
    this.structuresService.deleteMode = !this.structuresService.deleteMode;
  }

  restoreDeletedModules() {
    this.structuresService.deleteFilter('eliminados');
  }

  loadModuleGroups() {
    this.structuresService.loadModuleGroups = true;
  }
}
