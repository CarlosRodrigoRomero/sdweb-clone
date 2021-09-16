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
import { CriticidadFilterComponent } from './components/criticidad-filter/criticidad-filter.component';
import { ConfianzaFilterComponent } from './components/confianza-filter/confianza-filter.component';
import { AspectRatioFilterComponent } from './components/aspect-ratio-filter/aspect-ratio-filter.component';
import { AreaModuloBrutoFilterComponent } from './components/area-modulo-bruto-filter/area-modulo-bruto-filter.component';
import { SegsNoAnomsFilterComponent } from './components/segs-no-anoms-filter/segs-no-anoms-filter.component';

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
    CriticidadFilterComponent,
    ConfianzaFilterComponent,
    AspectRatioFilterComponent,
    AreaModuloBrutoFilterComponent,
    SegsNoAnomsFilterComponent,
  ],
  imports: [CommonModule, SharedModule],
  exports: [
    FiltersPanelComponent,
    ConfianzaFilterComponent,
    AspectRatioFilterComponent,
    AreaModuloBrutoFilterComponent,
  ],
})
export class FiltersModule {}
