import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appDynamicAnomaliaList]',
})
export class DynamicAnomaliaListDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
