import { Component, OnInit } from '@angular/core';

import { StructuresService } from '@core/services/structures.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-refresh',
  templateUrl: './refresh.component.html',
  styleUrls: ['./refresh.component.css'],
})
export class RefreshComponent implements OnInit {
  constructor(private structuresService: StructuresService) {}

  ngOnInit(): void {}

  refreshData() {
    this.refreshModGroups();
    this.refreshNormModules();
  }

  private refreshModGroups() {
    this.structuresService
      .getModuleGroups()
      .pipe(take(1))
      .subscribe((modGroups) => (this.structuresService.allModGroups = modGroups));
  }

  private refreshNormModules() {
    this.structuresService
      .getNormModules()
      .pipe(take(1))
      .subscribe((normMods) => (this.structuresService.allNormModules = normMods));
  }
}
