import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { GetNombreSeguidorPipe } from './pipes/get-nombre-seguidor.pipe';
import { GetNumeroModulosPipe } from './pipes/get-numero-modulos.pipe';
import { ValidateElementoPlantaPipe } from './pipes/validate-elemento-planta.pipe';

import { MaterialModule } from '@shared/modules/material/material.module';

import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { ClipboardModule } from 'ngx-clipboard';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { NavbarComponent } from './components/navbar/navbar.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { ThermalSliderComponent } from './components/thermal-slider/thermal-slider.component';
import { PlantSummaryComponent } from './components/plant-summary/plant-summary.component';

const components = [NavbarComponent, SpinnerComponent, ThermalSliderComponent, PlantSummaryComponent];
const modules = [
  CommonModule,
  RouterModule,
  MaterialModule,
  NgxSliderModule,
  FormsModule,
  ReactiveFormsModule,
  NgxMatSelectSearchModule,
];
const pipes = [GetNombreSeguidorPipe, GetNumeroModulosPipe, ValidateElementoPlantaPipe];

@NgModule({
  declarations: [...components, ...pipes],
  imports: [...modules, ClipboardModule],
  exports: [...components, ...modules, ...pipes],
})
export class SharedModule {}
