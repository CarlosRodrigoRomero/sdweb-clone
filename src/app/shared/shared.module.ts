import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { GetNombreSeguidorPipe } from './pipes/get-nombre-seguidor.pipe';
import { GetNumeroModulosPipe } from './pipes/get-numero-modulos.pipe';
import { ValidateElementoPlantaPipe } from './pipes/validate-elemento-planta.pipe';

import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { ClipboardModule } from 'ngx-clipboard';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { TranslateModule } from '@ngx-translate/core';

import { MaterialModule } from '@shared/modules/material/material.module';
import { ChartsModule } from './modules/charts/charts.module';
import { OlMapsModule } from './modules/ol-maps/ol-maps.module';

import { SpinnerComponent } from './components/spinner/spinner.component';
import { ThermalSliderComponent } from './components/thermal-slider/thermal-slider.component';
import { PlantSummaryComponent } from './components/plant-summary/plant-summary.component';
import { MatSelectedSearchComponent } from './components/mat-selected-search/mat-selected-search.component';
import { MatDialogConfirmComponent } from './components/mat-dialog-confirm/mat-dialog-confirm.component';
import { LoadingComponent } from './components/loading/loading.component';
import { WarningsMenuComponent } from './components/warnings-menu/warnings-menu.component';
import { WarningsComponent } from './components/warnings/warnings.component';
import { ReportRecalcComponent } from './components/report-recalc/report-recalc.component';
import { SimplePlantSummaryComponent } from './components/simple-plant-summary/simple-plant-summary.component';
import { SwitchThemeComponent } from './components/switch-theme/switch-theme.component';
import { SdLogoComponent } from './components/sd-logo/sd-logo.component';
import { SdCompleteLogoComponent } from './components/sd-complete-logo/sd-complete-logo.component';
import { RecommendedActionComponent } from './components/recommended-action/recommended-action.component';
import { RecommendedActionsComponent } from './components/recommended-actions/recommended-actions.component';
import { SelectLanguageComponent } from './components/select-language/select-language.component';
import { PortfolioRecalcComponent } from './components/portfolio-recalc/portfolio-recalc.component';

const components = [
  SpinnerComponent,
  ThermalSliderComponent,
  PlantSummaryComponent,
  MatSelectedSearchComponent,
  LoadingComponent,
  MatDialogConfirmComponent,
  WarningsMenuComponent,
  WarningsComponent,
  ReportRecalcComponent,
  SimplePlantSummaryComponent,
  SwitchThemeComponent,
  SdLogoComponent,
  SdCompleteLogoComponent,
  RecommendedActionComponent,
  RecommendedActionsComponent,
  SelectLanguageComponent,
  PortfolioRecalcComponent,
];

const pipes = [GetNombreSeguidorPipe, GetNumeroModulosPipe, ValidateElementoPlantaPipe];

@NgModule({
  declarations: [...components, ...pipes],
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    NgxSliderModule,
    FormsModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule,
    ClipboardModule,
    OlMapsModule,
    ChartsModule,
    HttpClientModule,
    TranslateModule.forChild({ isolate: false }),
  ],
  exports: [
    ...components,
    ...pipes,
    CommonModule,
    RouterModule,
    MaterialModule,
    NgxSliderModule,
    FormsModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule,
    ClipboardModule,
    OlMapsModule,
    ChartsModule,
    HttpClientModule,
    TranslateModule,
  ],
})
export class SharedModule {}
