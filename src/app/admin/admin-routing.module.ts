import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminComponent } from './components/admin.component';

import { UsersComponent } from './components/users/users.component';
import { EditUserComponent } from './components/edit-user/edit-user.component';
import { CreateUserComponent } from './components/create-user/create-user.component';

import { ReportsComponent } from './components/reports/reports.component';
import { ReportCreateComponent } from './components/report-create/report-create.component';
import { ReportEditComponent } from './components/report-edit/report-edit.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: 'users',
        component: UsersComponent,
      },
      {
        path: 'users/edit/:id',
        component: EditUserComponent,
      },
      {
        path: 'users/create',
        component: CreateUserComponent,
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
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
