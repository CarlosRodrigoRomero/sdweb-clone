import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-leyenda',
  templateUrl: './leyenda.component.html',
  styleUrls: ['./leyenda.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeyendaComponent {
  @Input() plantaFija: boolean;
  @Input() viewsData: any;
  @Input() viewSelected: string;
  @Input() simplifiedView: boolean;
  @Input() currentZoom: number;
  @Input() zoomChangeView: number;
  @Input() tipos: any[];

  constructor() {}
}
