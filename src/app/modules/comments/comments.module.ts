import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CommentsRoutingModule } from './comments-routing.module';
import { SharedModule } from '@shared/shared.module';

import { CommentsComponent } from './components/comments.component';
import { AnomaliasListComponent } from './components/anomalias-list/anomalias-list.component';
import { AnomaliaContentComponent } from './components/anomalia-content/anomalia-content.component';
import { AnomaliaInfoComponent } from './components/anomalia-info/anomalia-info.component';
import { CommentsAreaComponent } from './components/comments-area/comments-area.component';
import { NewCommentComponent } from './components/new-comment/new-comment.component';
import { CommentComponent } from './components/comment/comment.component';
import { CommentsListComponent } from './components/comments-list/comments-list.component';
import { MapCommentsComponent } from './components/map-comments/map-comments.component';
import { ZonesCommentsComponent } from './components/zones-comments/zones-comments.component';
import { MapViewControlComponent } from './components/map-view-control/map-view-control.component';
import { MapSeguidoresCommentsComponent } from './components/map-seguidores-comments/map-seguidores-comments.component';
import { SeguidorInfoComponent } from './components/seguidor-info/seguidor-info.component';
import { ModuleInputComponent } from './components/module-input/module-input.component';
import { SerialNumberInputComponent } from './components/serial-number-input/serial-number-input.component';
import { ModuleInputDialogComponent } from './components/module-input-dialog/module-input-dialog.component';
import { CommentInputComponent } from './components/comment-input/comment-input.component';
import { AnomStatusSelectComponent } from './components/anom-status-select/anom-status-select.component';
import { AnomaliaInfoEditableComponent } from './components/anomalia-info-editable/anomalia-info-editable.component';

@NgModule({
  declarations: [
    CommentsComponent,
    AnomaliasListComponent,
    AnomaliaContentComponent,
    AnomaliaInfoComponent,
    CommentsAreaComponent,
    NewCommentComponent,
    CommentComponent,
    CommentsListComponent,
    MapCommentsComponent,
    ZonesCommentsComponent,
    MapViewControlComponent,
    MapSeguidoresCommentsComponent,
    SeguidorInfoComponent,
    ModuleInputComponent,
    SerialNumberInputComponent,
    ModuleInputDialogComponent,
    CommentInputComponent,
    AnomStatusSelectComponent,
    AnomaliaInfoEditableComponent,
  ],
  imports: [CommonModule, CommentsRoutingModule, SharedModule],
  exports: [CommentsAreaComponent, AnomaliaInfoEditableComponent],
})
export class CommentsModule {}
