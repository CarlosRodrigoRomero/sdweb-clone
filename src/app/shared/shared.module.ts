import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SpinnerModule } from './spinner/spinner.module';

import { GetNombreSeguidorPipe } from './pipes/get-nombre-seguidor.pipe';
import { GetNumeroModulosPipe } from './pipes/get-numero-modulos.pipe';
import { ValidateElementoPlantaPipe } from './pipes/validate-elemento-planta.pipe';

import { MaterialModule } from '@material/material.module';

import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { ClipboardModule } from 'ngx-clipboard';

const components = [];
const modules = [
  CommonModule,
  RouterModule,
  SpinnerModule,
  MaterialModule,
  NgxSliderModule,
  FormsModule,
  ReactiveFormsModule,
];
const pipes = [GetNombreSeguidorPipe, GetNumeroModulosPipe, ValidateElementoPlantaPipe];

@NgModule({
  declarations: [...components, ...pipes],
  imports: [...modules, ClipboardModule],
  exports: [...components, ...modules, ...pipes],
})
export class SharedModule {}
