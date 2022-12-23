import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appDynamicSeguidorList]',
})
export class DynamicSeguidorListDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
