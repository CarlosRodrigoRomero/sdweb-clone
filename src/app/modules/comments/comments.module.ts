import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CommentsRoutingModule } from './comments-routing.module';
import { SharedModule } from '@shared/shared.module';

import { CommentsComponent } from './components/comments.component';
import { AnomaliasListComponent } from './components/anomalias-list/anomalias-list.component';
import { CommentsZoneComponent } from './components/comments-zone/comments-zone.component';

@NgModule({
  declarations: [CommentsComponent, AnomaliasListComponent, CommentsZoneComponent],
  imports: [CommonModule, CommentsRoutingModule, SharedModule],
})
export class CommentsModule {}
