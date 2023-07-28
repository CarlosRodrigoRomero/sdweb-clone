import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { SeguidorViewService } from '@modules/tracker-plant/services/seguidor-view.service';

@Component({
  selector: 'app-seguidor-view-hide-elems',
  templateUrl: './seguidor-view-hide-elems.component.html',
  styleUrls: ['./seguidor-view-hide-elems.component.css'],
})
export class SeguidorViewHideElemsComponent implements OnInit, OnDestroy {
  public hideElems: boolean;

  private subscriptions: Subscription = new Subscription();

  constructor(private seguidorViewService: SeguidorViewService) {}

  ngOnInit(): void {
    this.subscriptions.add(this.seguidorViewService.hideElems$.subscribe((hideElems) => (this.hideElems = hideElems)));
  }

  switchVisibility() {
    this.seguidorViewService.hideElems = !this.seguidorViewService.hideElems;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
