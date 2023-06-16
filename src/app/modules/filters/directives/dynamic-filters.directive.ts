import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appDynamicFilters]',
})
export class DynamicFiltersDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
