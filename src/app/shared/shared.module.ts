import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { GetNombreSeguidorPipe } from './pipes/get-nombre-seguidor.pipe';
import { GetNumeroModulosPipe } from './pipes/get-numero-modulos.pipe';
import { ValidateElementoPlantaPipe } from './pipes/validate-elemento-planta.pipe';

import { MaterialModule } from '@shared/modules/material/material.module';
import { ChartsModule } from './modules/charts/charts.module';
import { OlMapsModule } from './modules/ol-maps/ol-maps.module';

import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { ClipboardModule } from 'ngx-clipboard';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { NavbarComponent } from './components/navbar/navbar.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { ThermalSliderComponent } from './components/thermal-slider/thermal-slider.component';
import { PlantSummaryComponent } from './components/plant-summary/plant-summary.component';
import { MatSelectedSearchComponent } from './components/mat-selected-search/mat-selected-search.component';
import { MatDialogConfirmComponent } from './components/mat-dialog-confirm/mat-dialog-confirm.component';
import { LoadingComponent } from './components/loading/loading.component';
import { WarningsMenuComponent } from './components/warnings-menu/warnings-menu.component';
import { WarningsComponent } from './components/warnings/warnings.component';

const components = [
  NavbarComponent,
  SpinnerComponent,
  ThermalSliderComponent,
  PlantSummaryComponent,
  MatSelectedSearchComponent,
  LoadingComponent,
  MatDialogConfirmComponent,
  WarningsMenuComponent,
  WarningsComponent,
];
const modules = [
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
];
const pipes = [GetNombreSeguidorPipe, GetNumeroModulosPipe, ValidateElementoPlantaPipe];

@NgModule({
  declarations: [...components, ...pipes],
  imports: [...modules],
  exports: [...components, ...modules, ...pipes],
})
export class SharedModule {}
