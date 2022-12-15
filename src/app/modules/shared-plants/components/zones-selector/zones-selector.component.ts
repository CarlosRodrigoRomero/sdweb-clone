import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { Task } from '@modules/shared-plants/containers/zones-selector-container/zones-selector-container.component';

@Component({
  selector: 'app-zones-selector',
  templateUrl: './zones-selector.component.html',
  styleUrls: ['./zones-selector.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZonesSelectorComponent {
  @Input() allComplete: boolean;
  @Input() task: Task;
  @Output() taskChange = new EventEmitter<Task>();
  @Input() numAreas: number;
  @Output() setVisibilityLayer = new EventEmitter<number>();
  @Output() setVisibilityAllLayers = new EventEmitter<boolean>();

  someComplete(): boolean {
    if (this.task.subtasks == null) {
      return false;
    }
    return this.task.subtasks.filter((t) => t.completed).length > 0 && !this.allComplete;
  }

  stopPropagation(event) {
    event.stopPropagation();
  }
}
