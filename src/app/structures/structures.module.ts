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
import { NormModulesComponent } from './components/norm-modules/norm-modules.component';
import { NormModCreatePopupComponent } from './components/norm-mod-create-popup/norm-mod-create-popup.component';
import { AutoNormModulesComponent } from './components/auto-norm-modules/auto-norm-modules.component';

@NgModule({
  declarations: [StructuresComponent, MapStructuresComponent, ModuleGroupsComponent, RawModulesComponent, AutoModuleGroupsComponent, NormModulesComponent, NormModCreatePopupComponent, AutoNormModulesComponent],
  imports: [CommonModule, StructuresRoutingModule, SharedModule, FiltersModule],
})
export class StructuresModule {}
