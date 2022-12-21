import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-area-filter',
  templateUrl: './area-filter.component.html',
  styleUrls: ['./area-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreaFilterComponent {
  @Input() activeDelete: boolean;
  @Input() activeDraw: boolean;
  @Output() clickDraw = new EventEmitter<void>();

  clickButtonDraw() {
    this.clickDraw.emit();
  }
}
