import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminComponent } from './components/admin.component';

import { UsersComponent } from './components/users/users.component';
import { UserEditComponent } from './components/user-edit/user-edit.component';
import { UserCreateComponent } from './components/user-create/user-create.component';

import { ReportsComponent } from './components/reports/reports.component';
import { ReportCreateComponent } from './components/report-create/report-create.component';
import { ReportEditComponent } from './components/report-edit/report-edit.component';

import { ThermalLayerCreateComponent } from './components/thermal-layer-create/thermal-layer-create.component';

import { PlantsComponent } from './components/plants/plants.component';
import { PlantCreateComponent } from './components/plant-create/plant-create.component';
import { PlantEditComponent } from './components/plant-edit/plant-edit.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      { path: '', redirectTo: 'reports', pathMatch: 'full' },
      {
        path: 'users',
        component: UsersComponent,
      },
      {
        path: 'users/edit/:id',
        component: UserEditComponent,
      },
      {
        path: 'users/create',
        component: UserCreateComponent,
      },
      {
        path: 'reports',
        component: ReportsComponent,
      },
      {
        path: 'reports/edit/:id',
        component: ReportEditComponent,
      },
      {
        path: 'reports/create',
        component: ReportCreateComponent,
      },
      {
        path: 'thermalLayer/:id',
        component: ThermalLayerCreateComponent,
      },
      {
        path: 'plants',
        component: PlantsComponent,
      },
      {
        path: 'plants/edit/:id',
        component: PlantEditComponent,
      },
      {
        path: 'plants/create',
        component: PlantCreateComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
