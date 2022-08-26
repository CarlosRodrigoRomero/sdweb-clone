import { Component, Input, OnInit, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';

import { ZoneTask } from '../load-elems/load-elems.component';

@Component({
  selector: 'app-list-elems',
  templateUrl: './list-elems.component.html',
  styleUrls: ['./list-elems.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListElemsComponent implements OnInit {
  @Input() thereAreZones: boolean;
  @Input() modulesLoaded: boolean;
  @Input() zones: ZoneTask[] = [];
  @Output() zonesSelected = new EventEmitter<ZoneTask[]>();
  @Output() load = new EventEmitter();
  allComplete = false;

  constructor() {}

  ngOnInit(): void {}

  loadElems() {
    this.zonesSelected.emit(this.zones);
    this.load.emit();
  }

  someComplete(): boolean {
    if (this.zones === null) {
      return false;
    }
    return this.zones.filter((t) => t.completed).length > 0 && !this.allComplete;
  }

  setAll(completed: boolean) {
    this.allComplete = completed;
    if (this.zones == null) {
      return;
    }
    this.zones.forEach((t) => (t.completed = completed));
  }
}
