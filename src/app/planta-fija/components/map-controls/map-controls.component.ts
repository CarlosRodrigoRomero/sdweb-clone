import { Component } from '@angular/core';

import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-map-controls',
  templateUrl: './map-controls.component.html',
  styleUrls: ['./map-controls.component.css'],
})
export class MapControlsComponent {
  constructor(private _bottomSheetRef: MatBottomSheetRef<MapControlsComponent>) {}
}
