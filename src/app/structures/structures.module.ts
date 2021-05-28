import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StructuresRoutingModule } from './structures-routing.module';
import { SharedModule } from '@shared/shared.module';
import { FiltersModule } from '@filters/filters.module';

import { StructuresComponent } from './components/structures.component';
import { MapStructuresComponent } from './components/map-structures/map-structures.component';
import { ModuleGroupsComponent } from './components/module-groups/module-groups.component';
import { RawModulesComponent } from './components/raw-modules/raw-modules.component';
import { AutoModuleGroupsComponent } from './components/auto-module-groups/auto-module-groups.component';

@NgModule({
  declarations: [StructuresComponent, MapStructuresComponent, ModuleGroupsComponent, RawModulesComponent, AutoModuleGroupsComponent],
  imports: [CommonModule, StructuresRoutingModule, SharedModule, FiltersModule],
})
export class StructuresModule {}
