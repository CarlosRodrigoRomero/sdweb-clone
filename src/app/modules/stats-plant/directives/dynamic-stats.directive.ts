import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appDynamicStats]',
})
export class DynamicStatsDirective {
  constructor(public viewContainerRef: ViewContainerRef) {console.log("HOLA")}
}
