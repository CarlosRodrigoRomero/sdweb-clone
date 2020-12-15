import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SharedModule } from '@shared/shared.module';

import { AdminRoutingModule } from './admin-routing.module';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AllUsersComponent } from './components/all-users/all-users.component';
import { EditUserComponent } from './components/edit-user/edit-user.component';

@NgModule({
  declarations: [DashboardComponent, AllUsersComponent, EditUserComponent],
  imports: [CommonModule, RouterModule, AdminRoutingModule, SharedModule],
})
export class AdminModule {}
