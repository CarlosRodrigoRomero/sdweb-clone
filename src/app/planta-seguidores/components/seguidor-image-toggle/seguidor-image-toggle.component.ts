import { Component, OnInit } from '@angular/core';

import { SeguidorViewService } from '../../services/seguidor-view.service';

@Component({
  selector: 'app-seguidor-image-toggle',
  templateUrl: './seguidor-image-toggle.component.html',
  styleUrls: ['./seguidor-image-toggle.component.css'],
})
export class SeguidorImageToggleComponent implements OnInit {
  public imageSelected: number;

  constructor(private seguidorViewService: SeguidorViewService) {}

  ngOnInit(): void {
    this.seguidorViewService.imageSelected$.subscribe((image) => (this.imageSelected = image));
  }

  onToggleChange(value) {
    this.seguidorViewService.imageSelected = value;
  }
}
