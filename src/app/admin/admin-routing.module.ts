import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AllUsersComponent } from './components/all-users/all-users.component';
import { EditUserComponent } from './components/edit-user/edit-user.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      {
        path: 'users',
        component: AllUsersComponent,
      },
      {
        path: 'edit/:id',
        component: EditUserComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
