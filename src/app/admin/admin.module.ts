import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LayoutModule } from '@angular/cdk/layout';

import { SharedModule } from '@shared/shared.module';

import { AdminRoutingModule } from './admin-routing.module';
import { EditUserComponent } from './components/edit-user/edit-user.component';
import { SideBarComponent } from './components/side-bar/side-bar.component';
import { UsersComponent } from './components/users/users.component';
import { PlantasTableComponent } from './components/plantas-table/plantas-table.component';

@NgModule({
  declarations: [EditUserComponent, SideBarComponent, UsersComponent, PlantasTableComponent],
  imports: [CommonModule, RouterModule, AdminRoutingModule, SharedModule, LayoutModule],
})
export class AdminModule {}
