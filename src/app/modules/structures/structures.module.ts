import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StructuresRoutingModule } from './structures-routing.module';
import { SharedModule } from '@shared/shared.module';
import { FiltersModule } from '../filters/filters.module';

import { StructuresComponent } from './components/structures.component';
import { MapStructuresComponent } from './components/map-structures/map-structures.component';
import { ModuleGroupsComponent } from './components/module-groups/module-groups.component';
import { RawModulesComponent } from './components/raw-modules/raw-modules.component';
import { AutoModuleGroupsComponent } from './components/auto-module-groups/auto-module-groups.component';
import { NormModulesComponent } from './components/norm-modules/norm-modules.component';
import { NormModCreatePopupComponent } from './components/norm-mod-create-popup/norm-mod-create-popup.component';
import { AutoNormModulesComponent } from './components/auto-norm-modules/auto-norm-modules.component';
import { RawModulesFiltersComponent } from './components/raw-modules-filters/raw-modules-filters.component';
import { RefreshComponent } from './components/refresh/refresh.component';
import { LoadElemsComponent } from './components/load-elems/load-elems.component';
import { ListElemsComponent } from './components/list-elems/list-elems.component';

@NgModule({
  declarations: [
    StructuresComponent,
    MapStructuresComponent,
    ModuleGroupsComponent,
    RawModulesComponent,
    AutoModuleGroupsComponent,
    NormModulesComponent,
    NormModCreatePopupComponent,
    AutoNormModulesComponent,
    RawModulesFiltersComponent,
    RefreshComponent,
    LoadElemsComponent,
    ListElemsComponent,
  ],
  imports: [CommonModule, StructuresRoutingModule, SharedModule, FiltersModule],
})
export class StructuresModule {}
