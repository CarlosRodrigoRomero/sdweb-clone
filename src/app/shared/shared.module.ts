import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterModule } from '@angular/router';
import { SpinnerModule } from './spinner/spinner.module';

import { MaterialModule } from '@material/material.module';

const components = [];
const modules = [CommonModule, RouterModule, SpinnerModule, MaterialModule];

@NgModule({
  declarations: [...components],
  imports: [...modules],
  exports: [...components, ...modules],
})
export class SharedModule {}
