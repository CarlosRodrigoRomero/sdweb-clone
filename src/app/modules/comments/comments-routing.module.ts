import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CommentsComponent } from './components/comments.component';

const routes: Routes = [
  {
    path: ':id',
    component: CommentsComponent,
    children: [
      { path: '', redirectTo: 'map', pathMatch: 'full' },
      {
        path: 'map',
        component: CommentsComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CommentsRoutingModule {}
