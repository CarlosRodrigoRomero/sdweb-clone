import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { SeguidorViewService } from '../../services/seguidor-view.service';

@Component({
  selector: 'app-seguidor-image-toggle',
  templateUrl: './seguidor-image-toggle.component.html',
  styleUrls: ['./seguidor-image-toggle.component.css'],
})
export class SeguidorImageToggleComponent implements OnInit, OnDestroy {
  public imageSelected: number;

  private subscriptions: Subscription = new Subscription();

  constructor(private seguidorViewService: SeguidorViewService) {}

  ngOnInit(): void {
    this.subscriptions.add(this.seguidorViewService.imageSelected$.subscribe((image) => (this.imageSelected = image)));
  }

  onToggleChange(value) {
    this.seguidorViewService.imageSelected = value;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
