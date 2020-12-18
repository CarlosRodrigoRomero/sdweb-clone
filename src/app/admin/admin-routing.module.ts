import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UsersComponent } from './components/users/users.component';
import { EditUserComponent } from './components/edit-user/edit-user.component';
import { SideBarComponent } from './components/side-bar/side-bar.component';
import { CreateUserComponent } from './components/create-user/create-user.component';

const routes: Routes = [
  {
    path: '',
    component: SideBarComponent,
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
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
