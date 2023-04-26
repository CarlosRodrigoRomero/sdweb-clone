import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LayoutModule } from '@angular/cdk/layout';

import { SharedModule } from '@shared/shared.module';

import { AdminRoutingModule } from './admin-routing.module';
import { UserEditComponent } from './components/user-edit/user-edit.component';
import { AdminComponent } from './components/admin.component';
import { UsersComponent } from './components/users/users.component';
import { PlantasTableComponent } from './components/plantas-table/plantas-table.component';
import { UserCreateComponent } from './components/user-create/user-create.component';
import { ReportsComponent } from './components/reports/reports.component';
import { ReportCreateComponent } from './components/report-create/report-create.component';
import { ReportEditComponent } from './components/report-edit/report-edit.component';
import { ThermalLayerCreateComponent } from './components/thermal-layer-create/thermal-layer-create.component';
import { PlantsComponent } from './components/plants/plants.component';
import { PlantCreateComponent } from './components/plant-create/plant-create.component';
import { PlantEditComponent } from './components/plant-edit/plant-edit.component';
import { ReportsSharedComponent } from './components/reports-shared/reports-shared.component';
import { EmpresasComponent } from './components/empresas/empresas.component';

@NgModule({
  declarations: [
    UserEditComponent,
    AdminComponent,
    UsersComponent,
    PlantasTableComponent,
    UserCreateComponent,
    ReportsComponent,
    ReportCreateComponent,
    ReportEditComponent,
    ThermalLayerCreateComponent,
    PlantsComponent,
    PlantCreateComponent,
    PlantEditComponent,
    ReportsSharedComponent,
    EmpresasComponent,
  ],
  imports: [CommonModule, RouterModule, AdminRoutingModule, SharedModule, LayoutModule],
})
export class AdminModule {}
