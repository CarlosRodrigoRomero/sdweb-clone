import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LayoutModule } from '@angular/cdk/layout';

import { SharedModule } from '@shared/shared.module';

import { AdminRoutingModule } from './admin-routing.module';
import { EditUserComponent } from './components/edit-user/edit-user.component';
import { AdminComponent } from './components/admin.component';
import { UsersComponent } from './components/users/users.component';
import { PlantasTableComponent } from './components/plantas-table/plantas-table.component';
import { CreateUserComponent } from './components/create-user/create-user.component';
import { ReportsComponent } from './components/reports/reports.component';

@NgModule({
  declarations: [EditUserComponent, AdminComponent, UsersComponent, PlantasTableComponent, CreateUserComponent, ReportsComponent],
  imports: [CommonModule, RouterModule, AdminRoutingModule, SharedModule, LayoutModule],
})
export class AdminModule {}
