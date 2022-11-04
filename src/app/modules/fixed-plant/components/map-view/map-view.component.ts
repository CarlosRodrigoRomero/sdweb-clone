import {
  Component,
  ViewChild,
  ComponentFactoryResolver,
  Input,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges,
  ChangeDetectorRef,
} from '@angular/core';

import { MatSidenav } from '@angular/material/sidenav';

import { DynamicStatsDirective } from '@modules/stats-plant/directives/dynamic-stats.directive';

import { PlantaStatsComponent } from '@modules/stats-plant/components/planta-stats.component';

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapViewComponent implements OnChanges {
  @Input() mapLoaded: boolean;
  @Input() anomaliasLoaded: boolean;
  @Input() generatingDownload: boolean;
  @Input() showFilters: boolean;
  @Input() viewSelected: string;
  @Input() thereAreZones: boolean;
  @Input() sharedReport: boolean;
  @Input() completeView: boolean;
  @Input() noAnomsReport: boolean;
  @Output() setSidenavStats = new EventEmitter<MatSidenav>();

  @ViewChild('sidenavLeft') sidenavLeft: MatSidenav;
  @ViewChild('sidenavRight') sidenavRight: MatSidenav;
  @ViewChild('sidenavStats') sidenavStats: MatSidenav;

  @ViewChild(DynamicStatsDirective) dynamicStats: DynamicStatsDirective;

  constructor(private componentFactoryResolver: ComponentFactoryResolver, private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.mapLoaded && changes.mapLoaded.currentValue === true) {
      this.setSidenavStats.emit(this.sidenavStats);
    }
  }

  loadStats() {
    const component = this.componentFactoryResolver.resolveComponentFactory(PlantaStatsComponent);

    this.dynamicStats.viewContainerRef.clear();
    this.dynamicStats.viewContainerRef.createComponent(component);
  }
}
