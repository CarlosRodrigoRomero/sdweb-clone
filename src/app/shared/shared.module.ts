import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { SpinnerModule } from './spinner/spinner.module';

import { GetNombreSeguidorPipe } from './pipes/get-nombre-seguidor.pipe';
import { GetNumeroModulosPipe } from './pipes/get-numero-modulos.pipe';
import { ValidateElementoPlantaPipe } from './pipes/validate-elemento-planta.pipe';

import { MaterialModule } from '@material/material.module';

import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { SimplebarAngularModule } from 'simplebar-angular';

const components = [];
const modules = [
  CommonModule,
  RouterModule,
  SpinnerModule,
  MaterialModule,
  ReactiveFormsModule,
  NgxSliderModule,
  SimplebarAngularModule,
];
const pipes = [GetNombreSeguidorPipe, GetNumeroModulosPipe, ValidateElementoPlantaPipe];

@NgModule({
  declarations: [...components, ...pipes],
  imports: [...modules],
  exports: [...components, ...modules, ...pipes],
})
export class SharedModule {}
