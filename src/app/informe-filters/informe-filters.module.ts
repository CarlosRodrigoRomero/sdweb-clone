import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { FiltersPanelComponent } from './components/filters-panel/filters-panel.component';
import { PerdidasFilterComponent } from './components/perdidas-filter/perdidas-filter.component';
import { TempMaxFilterComponent } from './components/temp-max-filter/temp-max-filter.component';
import { GradientFilterComponent } from './components/gradient-filter/gradient-filter.component';
import { TipoFilterComponent } from './components/tipo-filter/tipo-filter.component';
import { ClaseFilterComponent } from './components/clase-filter/clase-filter.component';
import { ModuloFilterComponent } from './components/modulo-filter/modulo-filter.component';
import { ZonaFilterComponent } from './components/zona-filter/zona-filter.component';
import { AreaFilterComponent } from './components/area-filter/area-filter.component';

@NgModule({
  declarations: [
    FiltersPanelComponent,
    PerdidasFilterComponent,
    TempMaxFilterComponent,
    GradientFilterComponent,
    TipoFilterComponent,
    ClaseFilterComponent,
    ModuloFilterComponent,
    ZonaFilterComponent,
    AreaFilterComponent,
  ],
  imports: [CommonModule, SharedModule],
  exports: [FiltersPanelComponent],
})
export class InformeFiltersModule {}
