import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { RightMenuComponent } from './components/right-menu/right-menu.component';
import { RightMenuContainerComponent } from './containers/right-menu-container/right-menu-container.component';

@NgModule({
  declarations: [RightMenuComponent, RightMenuContainerComponent],
  imports: [CommonModule, SharedModule],
  exports: [RightMenuContainerComponent],
})
export class RightMenuModule {}
